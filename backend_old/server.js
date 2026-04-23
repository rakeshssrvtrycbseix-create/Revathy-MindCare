require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Initialize DB (creates tables + seeds data on first run)
require("./db");

const doctorsRouter = require("./routes/doctors");
const slotsRouter = require("./routes/slots");
const appointmentsRouter = require("./routes/appointments");
const adminRouter = require("./routes/admin");
const { verifyAdmin } = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded doctor photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/doctors", doctorsRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/admin", adminRouter);

// Protected doctor management (add/delete require admin token)
const doctorsProtectedRouter = require("./routes/doctors");
app.post("/api/doctors", verifyAdmin, doctorsProtectedRouter);
app.delete("/api/doctors/:id", verifyAdmin, doctorsProtectedRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Revathy Mind Care API",
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧠 Revathy Mind Care API running on http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:3000/admin/login`);
  console.log(`📅 Appointments API: http://localhost:${PORT}/api/appointments`);
  console.log(`👨‍⚕️ Doctors API: http://localhost:${PORT}/api/doctors\n`);
});

module.exports = app;
