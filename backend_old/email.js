require("dotenv").config();
const nodemailer = require("nodemailer");

// ─── Gmail SMTP Transport ──────────────────────────────────────────────────
const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

/**
 * Format a date string to a readable Indian format
 */
function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format 24h time to 12h display
 */
function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Send email notification to admin (revathymindcare@gmail.com)
 * and booking confirmation to the patient.
 */
async function sendBookingEmails({
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
    console.log(`  → Would notify admin at ${process.env.ADMIN_EMAIL || "revathymindcare@gmail.com"}`);
    if (patientEmail) console.log(`  → Would notify patient ${patientName} at ${patientEmail}`);
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "revathymindcare@gmail.com";
  const formattedDate = formatDate(appointmentDate);
  const formattedTime = formatTime(appointmentTime);

  // ─── 1. Admin Notification Email ─────────────────────────────────────────
  const adminHTML = `
  <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#4A90E2,#2563eb);padding:28px 32px;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">🧠 Revathy Mind Care</h1>
      <p style="color:#dbeafe;margin:6px 0 0;font-size:14px;">New Appointment Booking</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#1e293b;font-size:15px;margin:0 0 20px;">A new counselling session has been booked. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:140px;">Appointment ID</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;font-weight:700;border-bottom:1px solid #f1f5f9;">#${appointmentId}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Patient Name</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${patientName}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Phone</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${patientPhone}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Email</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${patientEmail || "Not provided"}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Counsellor</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${doctorName} (${doctorRole})</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Date</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${formattedDate}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;">Time</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;border-bottom:1px solid #f1f5f9;">${formattedTime}</td></tr>
        <tr><td style="padding:10px 12px;font-weight:600;color:#64748b;font-size:13px;">Reason</td><td style="padding:10px 12px;color:#1e293b;font-size:14px;">${reason || "Not specified"}</td></tr>
      </table>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from Revathy Mind Care Booking System.</p>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"Revathy Mind Care" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `📅 New Booking #${appointmentId} — ${patientName} with ${doctorName}`,
      html: adminHTML,
    });
    console.log(`✅ Admin email sent to ${adminEmail}`);
  } catch (e) {
    console.error(`❌ Admin email failed: ${e.message}`);
  }

  // ─── 2. Patient Confirmation Email ───────────────────────────────────────
  if (patientEmail) {
    const patientHTML = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#A8D5BA,#4A90E2);padding:28px 32px;">
        <h1 style="color:#ffffff;margin:0;font-size:22px;">🧠 Revathy Mind Care</h1>
        <p style="color:#f0fdf4;margin:6px 0 0;font-size:14px;">Booking Confirmation</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#1e293b;font-size:15px;margin:0 0 6px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Your counselling appointment has been successfully booked! ✅ Here are your booking details:
        </p>
        <div style="background:linear-gradient(135deg,#f0f9ff,#f0fdf4);border-radius:12px;border:1px solid #e0f2fe;padding:20px 24px;margin-bottom:20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;font-size:13px;width:130px;">Appointment ID</td><td style="padding:8px 0;color:#4A90E2;font-size:14px;font-weight:700;">#${appointmentId}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;font-size:13px;">Counsellor</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${doctorName}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;font-size:13px;">Date</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#64748b;font-size:13px;">Time</td><td style="padding:8px 0;color:#1e293b;font-size:14px;">${formattedTime}</td></tr>
          </table>
        </div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
            📌 <strong>Important:</strong> All sessions are conducted <strong>online</strong>. Please ensure you have a stable internet connection and a quiet, private space for your session.
          </p>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 6px;">
          For any queries or to reschedule, please contact us:
        </p>
        <p style="color:#475569;font-size:14px;margin:0 0 4px;">📞 <strong>+91 9159715236</strong></p>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;">💬 <a href="https://wa.me/qr/TCJFIYJ4T7Q3F1" style="color:#25D366;text-decoration:none;font-weight:600;">WhatsApp Us</a></p>
        <p style="color:#64748b;font-size:13px;margin:0;">
          Thank you for trusting Revathy Mind Care. 🌱<br/>We look forward to supporting you.
        </p>
      </div>
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">Revathy Mind Care — Your Safe Space for Mental Wellness</p>
      </div>
    </div>`;

    try {
      await transporter.sendMail({
        from: `"Revathy Mind Care" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: patientEmail,
        subject: `✅ Booking Confirmed — ${formattedDate} at ${formattedTime} | Revathy Mind Care`,
        html: patientHTML,
      });
      console.log(`✅ Confirmation email sent to patient at ${patientEmail}`);
    } catch (e) {
      console.error(`❌ Patient email failed: ${e.message}`);
    }
  }
}

module.exports = { sendBookingEmails };
