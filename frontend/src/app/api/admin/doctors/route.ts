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
    SELECT d.*, COUNT(a.id) as appointment_count
    FROM doctors d
    LEFT JOIN appointments a ON d.id = a.doctor_id
    GROUP BY d.id
  `;
  const doctors = db.prepare(query).all();

  return NextResponse.json(doctors);
}
