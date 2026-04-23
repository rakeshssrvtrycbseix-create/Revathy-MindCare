const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, message: "Login successful" });
});

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Access denied. No token." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.admin) throw new Error("Not admin");
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

// GET /api/admin/stats
router.get("/stats", verifyAdmin, (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const totalAppointments = db
    .prepare("SELECT COUNT(*) as c FROM appointments")
    .get().c;
  const todayAppointments = db
    .prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE appointment_date = ?",
    )
    .get(today).c;
  const confirmedAppointments = db
    .prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE status = 'confirmed'",
    )
    .get().c;
  const cancelledAppointments = db
    .prepare(
      "SELECT COUNT(*) as c FROM appointments WHERE status = 'cancelled'",
    )
    .get().c;
  const totalDoctors = db.prepare("SELECT COUNT(*) as c FROM doctors").get().c;

  // Upcoming (future confirmed)
  const upcomingAppointments = db
    .prepare(
      `
    SELECT COUNT(*) as c FROM appointments 
    WHERE status = 'confirmed' AND (appointment_date > ? OR (appointment_date = ? AND appointment_time >= time('now', 'localtime')))
  `,
    )
    .get(today, today).c;

  res.json({
    totalAppointments,
    todayAppointments,
    confirmedAppointments,
    cancelledAppointments,
    upcomingAppointments,
    totalDoctors,
  });
});

// GET /api/admin/appointments – all appointments with filters
router.get("/appointments", verifyAdmin, (req, res) => {
  const { date, doctor_id, status, search } = req.query;
  let query = `
    SELECT a.*, d.name as doctor_name, d.role as doctor_role
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
  if (search) {
    query += " AND (a.patient_name LIKE ? OR a.patient_phone LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY a.appointment_date DESC, a.appointment_time DESC";
  res.json(db.prepare(query).all(...params));
});

// GET /api/admin/doctors – list doctors (admin)
router.get("/doctors", verifyAdmin, (req, res) => {
  const doctors = db
    .prepare(
      `
    SELECT d.*, COUNT(a.id) as appointment_count
    FROM doctors d
    LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status = 'confirmed'
    GROUP BY d.id
  `,
    )
    .all();
  res.json(doctors);
});

// Export verifyAdmin so server.js can use it for protected routes
module.exports = router;
module.exports.verifyAdmin = verifyAdmin;
