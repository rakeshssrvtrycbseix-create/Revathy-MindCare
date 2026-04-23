import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const doctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(id);
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  
  return NextResponse.json({
    ...doctor,
    languages: doctor.languages ? doctor.languages.split(",") : [],
    available_days: doctor.available_days ? doctor.available_days.split(",") : [],
    specialties: doctor.specialization
      ? doctor.specialization.split(",").map((s) => s.trim())
      : [],
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Verify Admin
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return NextResponse.json({ error: "Access denied" }, { status: 401 });
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const doctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(id);
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  db.prepare("DELETE FROM time_slots WHERE doctor_id = ?").run(id);
  db.prepare("DELETE FROM doctors WHERE id = ?").run(id);
  
  return NextResponse.json({ message: "Doctor removed successfully" });
}
