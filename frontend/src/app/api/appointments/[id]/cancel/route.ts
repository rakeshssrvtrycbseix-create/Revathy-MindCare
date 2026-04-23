import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  
  const appt = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  if (appt.status === "cancelled") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

  db.transaction(() => {
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run("cancelled", appt.id);
    db.prepare(
      `
      UPDATE time_slots SET is_booked = 0 
      WHERE doctor_id = ? AND date = ? AND time = ?
    `
    ).run(appt.doctor_id, appt.appointment_date, appt.appointment_time);
  })();

  return NextResponse.json({ message: "Appointment cancelled and slot freed" });
}
