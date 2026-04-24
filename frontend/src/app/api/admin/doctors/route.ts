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

  // Get doctors with appointment counts
  const { data: doctors, error } = await supabase
    .from("doctors")
    .select(`
      *,
      appointments (
        id
      )
    `);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map to match the old structure
  const result = (doctors || []).map((d: any) => ({
    ...d,
    appointment_count: d.appointments?.length || 0,
  }));

  return NextResponse.json(result);
}
