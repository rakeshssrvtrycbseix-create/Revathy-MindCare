import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctor_id = searchParams.get("doctor_id");
  const date = searchParams.get("date");

  if (!doctor_id || !date) {
    return NextResponse.json({ error: "doctor_id and date are required" }, { status: 400 });
  }

  const db = getDb();
  const slots = db
    .prepare(
      `
    SELECT id, time, is_booked
    FROM time_slots
    WHERE doctor_id = ? AND date = ?
    ORDER BY time ASC
  `
    )
    .all(doctor_id, date);

  const formatted = slots.map((s) => ({
    id: s.id,
    time: s.time,
    display: formatTime(s.time),
    available: s.is_booked === 0,
  }));

  return NextResponse.json(formatted);
}

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
