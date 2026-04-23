import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

export async function GET() {
  const db = getDb();
  const doctors = db.prepare("SELECT * FROM doctors").all();
  const result = doctors.map((d) => ({
    ...d,
    languages: d.languages ? d.languages.split(",") : [],
    available_days: d.available_days ? d.available_days.split(",") : [],
    specialties: d.specialization
      ? d.specialization.split(",").map((s) => s.trim())
      : [],
  }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  // Verify Admin
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return NextResponse.json({ error: "Access denied" }, { status: 401 });
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const {
    name,
    qualification,
    role,
    specialization,
    description,
    photo_url,
    languages,
    available_days,
    timings,
    phone,
  } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO doctors (name, qualification, role, specialization, description, photo_url, languages, available_days, timings, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    qualification,
    role,
    specialization,
    description,
    photo_url || "",
    languages,
    available_days,
    timings || "17:00-22:00",
    phone || "",
  );
  
  const newDoctor = db.prepare("SELECT * FROM doctors WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(newDoctor, { status: 201 });
}
