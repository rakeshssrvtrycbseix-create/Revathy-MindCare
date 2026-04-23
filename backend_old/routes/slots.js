const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/slots?doctor_id=X&date=YYYY-MM-DD
router.get("/", (req, res) => {
  const { doctor_id, date } = req.query;
  if (!doctor_id || !date) {
    return res.status(400).json({ error: "doctor_id and date are required" });
  }

  const slots = db
    .prepare(
      `
    SELECT id, time, is_booked
    FROM time_slots
    WHERE doctor_id = ? AND date = ?
    ORDER BY time ASC
  `,
    )
    .all(doctor_id, date);

  const formatted = slots.map((s) => ({
    id: s.id,
    time: s.time,
    display: formatTime(s.time),
    available: s.is_booked === 0,
  }));

  res.json(formatted);
});

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

module.exports = router;
