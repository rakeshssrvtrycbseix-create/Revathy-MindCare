import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendBookingEmails } from "@/lib/email";

export async function POST(req: Request) {
  const {
    patient_name,
    patient_phone,
    patient_email,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
  } = await req.json();

  if (!patient_name || !patient_phone || !doctor_id || !appointment_date || !appointment_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();

  // Check the slot exists and is available
  const slot = db
    .prepare("SELECT * FROM time_slots WHERE doctor_id = ? AND date = ? AND time = ?")
    .get(doctor_id, appointment_date, appointment_time);

  if (!slot) {
    return NextResponse.json({ error: "Time slot not found for this doctor on the selected date" }, { status: 404 });
  }

  if (slot.is_booked) {
    return NextResponse.json({ error: "This time slot is already booked. Please choose another slot." }, { status: 409 });
  }

  // Atomic transaction
  const bookAppointment = db.transaction(() => {
    db.prepare("UPDATE time_slots SET is_booked = 1 WHERE id = ?").run(slot.id);

    const result = db
      .prepare(
        `INSERT INTO appointments (patient_name, patient_phone, patient_email, doctor_id, appointment_date, appointment_time, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`
      )
      .run(patient_name, patient_phone, patient_email || "", doctor_id, appointment_date, appointment_time, reason || "");

    return result.lastInsertRowid;
  });

  const appointmentId = bookAppointment();

  // Get doctor details for Email
  const doctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(doctor_id);

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

  return NextResponse.json({
    message: "Appointment booked successfully!",
    appointment_id: appointmentId,
    patient_name,
    doctor_name: doctor.name,
    appointment_date,
    appointment_time,
    status: "confirmed",
  }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const doctor_id = searchParams.get("doctor_id");
  const status = searchParams.get("status");

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

  const db = getDb();
  const appointments = db.prepare(query).all(...params);
  
  return NextResponse.json(appointments);
}
