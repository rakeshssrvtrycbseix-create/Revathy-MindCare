import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) throw new Error("Unauthorized");
  jwt.verify(token, JWT_SECRET);
}

export async function GET(req: Request) {
  try {
    verifyAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const query = `
    SELECT a.*, d.name as doctor_name, d.role as doctor_role 
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;
  const appointments = db.prepare(query).all();

  return NextResponse.json(appointments);
}
