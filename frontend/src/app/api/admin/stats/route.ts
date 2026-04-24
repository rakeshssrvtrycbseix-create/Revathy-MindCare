import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) throw new Error("Unauthorized");
  jwt.verify(token, JWT_SECRET);
}

export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalAppts },
    { count: todayAppts },
    { count: confirmedAppts },
    { count: cancelledAppts },
    { count: upcomingAppts },
    { count: totalDoctors }
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("appointment_date", today),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("appointments").select("*", { count: "exact", head: true }).gte("appointment_date", today).eq("status", "confirmed"),
    supabase.from("doctors").select("*", { count: "exact", head: true })
  ]);

  return NextResponse.json({
    totalAppointments: totalAppts || 0,
    todayAppointments: todayAppts || 0,
    confirmedAppointments: confirmedAppts || 0,
    cancelledAppointments: cancelledAppts || 0,
    upcomingAppointments: upcomingAppts || 0,
    totalDoctors: totalDoctors || 0,
  });
}
