const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/doctors – list all doctors
router.get("/", (req, res) => {
  const doctors = db.prepare("SELECT * FROM doctors").all();
  const result = doctors.map((d) => ({
    ...d,
    languages: d.languages ? d.languages.split(",") : [],
    available_days: d.available_days ? d.available_days.split(",") : [],
    specialties: d.specialization
      ? d.specialization.split(",").map((s) => s.trim())
      : [],
  }));
  res.json(result);
});

// GET /api/doctors/:id – single doctor
router.get("/:id", (req, res) => {
  const doctor = db
    .prepare("SELECT * FROM doctors WHERE id = ?")
    .get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  res.json({
    ...doctor,
    languages: doctor.languages ? doctor.languages.split(",") : [],
    available_days: doctor.available_days
      ? doctor.available_days.split(",")
      : [],
    specialties: doctor.specialization
      ? doctor.specialization.split(",").map((s) => s.trim())
      : [],
  });
});

// POST /api/doctors – add doctor (admin protected via middleware in server.js)
router.post("/", (req, res) => {
  const {
    name,
    qualification,
    role,
    specialization,
    description,
    photo_url,
    languages,
    available_days,
    timings,
    phone,
  } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const stmt = db.prepare(`
    INSERT INTO doctors (name, qualification, role, specialization, description, photo_url, languages, available_days, timings, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    qualification,
    role,
    specialization,
    description,
    photo_url || "",
    languages,
    available_days,
    timings || "17:00-22:00",
    phone || "",
  );
  const newDoctor = db
    .prepare("SELECT * FROM doctors WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(newDoctor);
});

// DELETE /api/doctors/:id (admin protected)
router.delete("/:id", (req, res) => {
  const doctor = db
    .prepare("SELECT * FROM doctors WHERE id = ?")
    .get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });

  db.prepare("DELETE FROM time_slots WHERE doctor_id = ?").run(req.params.id);
  db.prepare("DELETE FROM doctors WHERE id = ?").run(req.params.id);
  res.json({ message: "Doctor removed successfully" });
});

module.exports = router;
