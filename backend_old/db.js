require("dotenv").config();
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "mindcare.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Create Tables ─────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    qualification TEXT,
    role TEXT,
    specialization TEXT,
    description TEXT,
    photo_url TEXT,
    languages TEXT,
    available_days TEXT,
    timings TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    doctor_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
  );

  CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_booked INTEGER DEFAULT 0,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    UNIQUE(doctor_id, date, time)
  );
`);

// ─── Seed Doctors ──────────────────────────────────────────────────────────
const existingDoctors = db
  .prepare("SELECT COUNT(*) as count FROM doctors")
  .get();
if (existingDoctors.count === 0) {
  const insertDoctor = db.prepare(`
    INSERT INTO doctors (name, qualification, role, specialization, description, photo_url, languages, available_days, timings, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const doctors = [
    {
      name: "Mr. Praveen Ravi",
      qualification: "M.A., B.Lib., M.Lib.ISc., M.SC",
      role: "Founder & Counselling Psychologist",
      specialization:
        "Individual Counselling, Mental Health Awareness, Psychological Assessment",
      description:
        "Mr. Praveen Ravi is the founder of Revathy Mind Care, committed to promoting mental health awareness and providing accessible psychological support. With a strong passion for helping individuals overcome emotional and psychological challenges, he established Revathy Mind Care with the vision of creating a safe and supportive space for mental wellbeing.",
      photo_url: "/doctors/praveen-ravi.jpeg",
      languages: "English,Tamil",
      available_days:
        "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
      timings: "17:00-22:00",
      phone: "+919159715236",
    },
    {
      name: "Dr. Pavithra S",
      qualification: "MBBS",
      role: "General Physician",
      specialization: "Medical Support, Health Assessment, Wellness Guidance",
      description:
        "Dr. Pavithra S is a qualified General Physician providing medical support and wellness guidance at Revathy Mind Care. She brings a holistic medical perspective to the counselling team, ensuring clients receive comprehensive health and mental wellness support.",
      photo_url: "/doctors/pavithra.jpeg",
      languages: "English,Tamil",
      available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
      timings: "17:00-22:00",
      phone: "+919159715236",
    },
    {
      name: "Ms. Nivetha S",
      qualification: "M.SC",
      role: "Counselling Psychologist",
      specialization:
        "Anxiety Counselling, Student Counselling, Stress Management",
      description:
        "Ms. Nivetha S is a dedicated Counselling Psychologist specializing in anxiety management, student counselling, and stress management. She provides evidence-based therapeutic support in a compassionate and non-judgmental environment.",
      photo_url: "/doctors/nivetha.jpeg",
      languages: "English,Tamil",
      available_days:
        "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
      timings: "17:00-22:00",
      phone: "+919159715236",
    },
    {
      name: "Ms. M. Yalini",
      qualification: "M.SC",
      role: "Psychologist",
      specialization:
        "Relationship Counselling, Adolescent Counselling, Career Counselling",
      description:
        "Ms. M. Yalini is a multilingual Psychologist fluent in English, Tamil, and Hindi. She specializes in relationship counselling, adolescent mental health, and career guidance, making her services accessible to a diverse range of clients.",
      photo_url: "/doctors/yalini.jpeg",
      languages: "English,Tamil,Hindi",
      available_days:
        "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
      timings: "17:00-22:00",
      phone: "+919159715236",
    },
    {
      name: "Ms. Krupa Elsa Abraham",
      qualification: "MSW",
      role: "Social Worker & Counsellor",
      specialization: "Social Support, Parenting Guidance, Group Counselling",
      description:
        "Ms. Krupa Elsa Abraham is a qualified Social Worker and Counsellor bringing a unique social work perspective to mental health support. She specializes in social welfare, parenting guidance, and group counselling, with fluency in English and Malayalam.",
      photo_url: "/doctors/krupa.jpeg",
      languages: "English,Malayalam",
      available_days:
        "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
      timings: "17:00-22:00",
      phone: "+919159715236",
    },
  ];

  doctors.forEach((d) => {
    insertDoctor.run(
      d.name,
      d.qualification,
      d.role,
      d.specialization,
      d.description,
      d.photo_url,
      d.languages,
      d.available_days,
      d.timings,
      d.phone,
    );
  });

  console.log("✅ Seeded 5 doctors");
}

// ─── Generate Time Slots ───────────────────────────────────────────────────
function generateSlotsForDoctor(doctorId, availableDays, timings) {
  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO time_slots (doctor_id, date, time, is_booked)
    VALUES (?, ?, ?, 0)
  `);

  const [startHour, endHour] = timings
    .split("-")
    .map((t) => parseInt(t.split(":")[0]));
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const availDaySet = new Set(availableDays.split(","));

  // Generate for next 60 days
  for (let d = 0; d < 60; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dayName = dayNames[date.getDay()];

    if (!availDaySet.has(dayName)) continue;

    const dateStr = date.toISOString().split("T")[0];

    // For Sunday start from 10:00
    const actualStart = dayName === "Sunday" ? 10 : startHour;
    const actualEnd = endHour;

    for (let h = actualStart; h < actualEnd; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        insertSlot.run(doctorId, dateStr, timeStr);
      }
    }
  }
}

// Generate slots only if table is empty
const slotCount = db.prepare("SELECT COUNT(*) as count FROM time_slots").get();
if (slotCount.count === 0) {
  const doctors = db
    .prepare("SELECT id, available_days, timings FROM doctors")
    .all();
  doctors.forEach((d) =>
    generateSlotsForDoctor(d.id, d.available_days, d.timings),
  );
  console.log("✅ Generated time slots for 60 days");
}

// ─── Schedule daily slot generation ───────────────────────────────────────
function addFutureSlotsIfNeeded() {
  const doctors = db
    .prepare("SELECT id, available_days, timings FROM doctors")
    .all();
  doctors.forEach((d) =>
    generateSlotsForDoctor(d.id, d.available_days, d.timings),
  );
}
// Run once at startup to fill any gaps
setTimeout(addFutureSlotsIfNeeded, 2000);

module.exports = db;
