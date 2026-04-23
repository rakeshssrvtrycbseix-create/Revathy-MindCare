import nodemailer from "nodemailer";

// ─── Generic SMTP Transport ────────────────────────────────────────────────
const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_PORT === "465", // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export async function sendBookingEmails({
  patientName,
  patientPhone,
  patientEmail,
  doctorName,
  doctorRole,
  appointmentDate,
  appointmentTime,
  reason,
  appointmentId,
}) {
  if (!transporter) {
    console.log("⚠️  Email not configured – skipping email notifications");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "revathymindcare@gmail.com";
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const formattedDate = formatDate(appointmentDate);
  const formattedTime = formatTime(appointmentTime);

  // 1. Admin Notification
  const adminHTML = `
  <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#4A90E2,#2563eb);padding:28px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">🧠 Revathy Mind Care</h1>
      <p style="color:#dbeafe;margin:6px 0 0;font-size:14px;">New Appointment Booking</p>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px;font-weight:bold;">ID</td><td>#${appointmentId}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Patient</td><td>${patientName}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Phone</td><td>${patientPhone}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Email</td><td>${patientEmail || "N/A"}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Doctor</td><td>${doctorName}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Date</td><td>${formattedDate}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Time</td><td>${formattedTime}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Reason</td><td>${reason || "N/A"}</td></tr>
      </table>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"Revathy Mind Care" <${fromEmail}>`,
      to: adminEmail,
      subject: `📅 New Booking #${appointmentId} — ${patientName} with ${doctorName}`,
      html: adminHTML,
    });
    console.log(`✅ Admin email sent to ${adminEmail}`);
  } catch (e) {
    console.error(`❌ Admin email failed: ${e.message}`);
  }

  // 2. Patient Confirmation
  if (patientEmail) {
    const patientHTML = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#A8D5BA,#4A90E2);padding:28px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">🧠 Revathy Mind Care</h1>
        <p style="color:#f0fdf4;margin:6px 0 0;font-size:14px;">Booking Confirmation</p>
      </div>
      <div style="padding:28px 32px;">
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your counselling appointment is confirmed!</p>
        <ul>
          <li><strong>ID:</strong> #${appointmentId}</li>
          <li><strong>Counsellor:</strong> ${doctorName}</li>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
        </ul>
        <p>All sessions are <strong>online</strong>. Please ensure a stable internet connection.</p>
        <p>📞 +91 9159715236</p>
      </div>
    </div>`;

    try {
      await transporter.sendMail({
        from: `"Revathy Mind Care" <${fromEmail}>`,
        to: patientEmail,
        subject: `✅ Booking Confirmed — ${formattedDate} at ${formattedTime} | Revathy Mind Care`,
        html: patientHTML,
      });
      console.log(`✅ Confirmation email sent to ${patientEmail}`);
    } catch (e) {
      console.error(`❌ Patient email failed: ${e.message}`);
    }
  }
}
