import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "revathy_mind_care_secret_2024";

export async function GET() {
  const { data: doctors, error } = await supabase.from("doctors").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (doctors || []).map((d: any) => ({
    ...d,
    languages: d.languages ? d.languages.split(",") : [],
    available_days: d.available_days ? d.available_days.split(",") : [],
    specialties: d.specialization
      ? d.specialization.split(",").map((s: string) => s.trim())
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

  const { data, error } = await supabase
    .from("doctors")
    .insert([
      {
        name,
        qualification,
        role,
        specialization,
        description,
        photo_url: photo_url || "",
        languages,
        available_days,
        timings: timings || "17:00-22:00",
        phone: phone || "",
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
