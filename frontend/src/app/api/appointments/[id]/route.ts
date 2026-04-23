import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  
  const appt = db
    .prepare(
      `
    SELECT a.*, d.name as doctor_name, d.role as doctor_role, d.photo_url
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = ?
  `
    )
    .get(id);

  if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  
  return NextResponse.json(appt);
}
