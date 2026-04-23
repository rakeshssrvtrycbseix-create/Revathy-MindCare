require("dotenv").config();

const twilio =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID !== "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ? require("twilio")(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      )
    : null;

/**
 * Send WhatsApp messages to patient and doctor on successful booking
 */
async function sendWhatsAppNotifications({
  patientName,
  patientPhone,
  doctorName,
  doctorPhone,
  date,
  time,
}) {
  if (!twilio) {
    console.log("⚠️  Twilio not configured – skipping WhatsApp messages");
    console.log(`  → Would notify patient ${patientName} at ${patientPhone}`);
    console.log(`  → Would notify doctor ${doctorName} at ${doctorPhone}`);
    return;
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = formatTime(time);

  const patientMsg = `🧠 *Revathy Mind Care*\n\nDear ${patientName},\n\nYour counselling appointment is *confirmed!* ✅\n\n👨‍⚕️ *Counsellor:* ${doctorName}\n📅 *Date:* ${formattedDate}\n⏰ *Time:* ${formattedTime}\n\nAll sessions are conducted *online*. Please ensure a stable internet connection.\n\nFor any queries:\n📞 +91 9159715236\n\nThank you for trusting Revathy Mind Care. 🌱`;

  const doctorMsg = `🧠 *Revathy Mind Care – New Appointment*\n\n📋 *Patient:* ${patientName}\n📅 *Date:* ${formattedDate}\n⏰ *Time:* ${formattedTime}\n📞 *Contact:* ${patientPhone}\n\nPlease prepare for the session on time.`;

  const promises = [];

  // Message to patient
  if (patientPhone) {
    const toPatient = patientPhone.startsWith("+")
      ? `whatsapp:${patientPhone}`
      : `whatsapp:+91${patientPhone}`;
    promises.push(
      twilio.messages
        .create({ from, to: toPatient, body: patientMsg })
        .then((m) => console.log(`✅ WhatsApp sent to patient: ${m.sid}`))
        .catch((e) =>
          console.error(`❌ WhatsApp to patient failed: ${e.message}`),
        ),
    );
  }

  // Message to doctor
  if (doctorPhone && doctorPhone !== patientPhone) {
    const toDoctor = doctorPhone.startsWith("+")
      ? `whatsapp:${doctorPhone}`
      : `whatsapp:+91${doctorPhone}`;
    promises.push(
      twilio.messages
        .create({ from, to: toDoctor, body: doctorMsg })
        .then((m) => console.log(`✅ WhatsApp sent to doctor: ${m.sid}`))
        .catch((e) =>
          console.error(`❌ WhatsApp to doctor failed: ${e.message}`),
        ),
    );
  }

  await Promise.all(promises);
}

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

module.exports = { sendWhatsAppNotifications };
