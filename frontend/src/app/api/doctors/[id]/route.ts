import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: doctor, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }
  
  return NextResponse.json({
    ...doctor,
    languages: doctor.languages ? doctor.languages.split(",") : [],
    available_days: doctor.available_days ? doctor.available_days.split(",") : [],
    specialties: doctor.specialization
      ? doctor.specialization.split(",").map((s: string) => s.trim())
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
  
  const { data: doctor, error: findError } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // time_slots are deleted automatically because of ON DELETE CASCADE
  const { error: deleteError } = await supabase
    .from("doctors")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: "Doctor removed successfully" });
}
