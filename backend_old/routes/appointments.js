const express = require("express");
const db = require("../db");
const { sendWhatsAppNotifications } = require("../whatsapp");
const { sendBookingEmails } = require("../email");
const router = express.Router();

// POST /api/appointments – book an appointment
router.post("/", async (req, res) => {
  const {
    patient_name,
    patient_phone,
    patient_email,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
  } = req.body;

  if (
    !patient_name ||
    !patient_phone ||
    !doctor_id ||
    !appointment_date ||
    !appointment_time
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check the slot exists and is available
  const slot = db
    .prepare(
      `
    SELECT * FROM time_slots 
    WHERE doctor_id = ? AND date = ? AND time = ?
  `,
    )
    .get(doctor_id, appointment_date, appointment_time);

  if (!slot) {
    return res.status(404).json({
      error: "Time slot not found for this doctor on the selected date",
    });
  }

  if (slot.is_booked) {
    return res.status(409).json({
      error: "This time slot is already booked. Please choose another slot.",
    });
  }

  // Atomic transaction: book slot + save appointment
  const bookAppointment = db.transaction(() => {
    db.prepare("UPDATE time_slots SET is_booked = 1 WHERE id = ?").run(slot.id);

    const result = db
      .prepare(
        `
      INSERT INTO appointments (patient_name, patient_phone, patient_email, doctor_id, appointment_date, appointment_time, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `,
      )
      .run(
        patient_name,
        patient_phone,
        patient_email || "",
        doctor_id,
        appointment_date,
        appointment_time,
        reason || "",
      );

    return result.lastInsertRowid;
  });

  const appointmentId = bookAppointment();

  // Get doctor details for WhatsApp + Email
  const doctor = db
    .prepare("SELECT * FROM doctors WHERE id = ?")
    .get(doctor_id);

  // Send WhatsApp notifications (async, non-blocking)
  sendWhatsAppNotifications({
    patientName: patient_name,
    patientPhone: patient_phone,
    doctorName: doctor.name,
    doctorPhone: doctor.phone,
    date: appointment_date,
    time: appointment_time,
  }).catch((e) => console.error("WhatsApp error:", e.message));

  // Send email notifications (async, non-blocking)
  sendBookingEmails({
    patientName: patient_name,
    patientPhone: patient_phone,
    patientEmail: patient_email || "",
    doctorName: doctor.name,
    doctorRole: doctor.role,
    appointmentDate: appointment_date,
    appointmentTime: appointment_time,
    reason: reason || "",
    appointmentId,
  }).catch((e) => console.error("Email error:", e.message));

  res.status(201).json({
    message: "Appointment booked successfully!",
    appointment_id: appointmentId,
    patient_name,
    doctor_name: doctor.name,
    appointment_date,
    appointment_time,
    status: "confirmed",
  });
});

// GET /api/appointments – all appointments (admin)
router.get("/", (req, res) => {
  const { date, doctor_id, status } = req.query;
  let query = `
    SELECT a.*, d.name as doctor_name, d.role as doctor_role, d.photo_url
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += " AND a.appointment_date = ?";
    params.push(date);
  }
  if (doctor_id) {
    query += " AND a.doctor_id = ?";
    params.push(doctor_id);
  }
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }

  query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";

  const appointments = db.prepare(query).all(...params);
  res.json(appointments);
});

// GET /api/appointments/:id – single appointment
router.get("/:id", (req, res) => {
  const appt = db
    .prepare(
      `
    SELECT a.*, d.name as doctor_name, d.role as doctor_role, d.photo_url
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `,
    )
    .get(req.params.id);
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  res.json(appt);
});

// PATCH /api/appointments/:id/cancel
router.patch("/:id/cancel", (req, res) => {
  const appt = db
    .prepare("SELECT * FROM appointments WHERE id = ?")
    .get(req.params.id);
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  if (appt.status === "cancelled")
    return res.status(400).json({ error: "Already cancelled" });

  db.transaction(() => {
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(
      "cancelled",
      appt.id,
    );
    db.prepare(
      `
      UPDATE time_slots SET is_booked = 0 
      WHERE doctor_id = ? AND date = ? AND time = ?
    `,
    ).run(appt.doctor_id, appt.appointment_date, appt.appointment_time);
  })();

  res.json({ message: "Appointment cancelled and slot freed" });
});

module.exports = router;
