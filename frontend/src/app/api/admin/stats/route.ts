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
  const today = new Date().toISOString().split("T")[0];

  const totalAppts = db.prepare("SELECT COUNT(*) as count FROM appointments").get().count;
  const todayAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?").get(today).count;
  const confirmedAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'").get().count;
  const cancelledAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'cancelled'").get().count;
  const upcomingAppts = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= ? AND status = 'confirmed'").get(today).count;
  const totalDoctors = db.prepare("SELECT COUNT(*) as count FROM doctors").get().count;

  return NextResponse.json({
    totalAppointments: totalAppts,
    todayAppointments: todayAppts,
    confirmedAppointments: confirmedAppts,
    cancelledAppointments: cancelledAppts,
    upcomingAppointments: upcomingAppts,
    totalDoctors: totalDoctors,
  });
}
