import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctor_id = searchParams.get("doctor_id");
  const date = searchParams.get("date");

  if (!doctor_id || !date) {
    return NextResponse.json({ error: "doctor_id and date are required" }, { status: 400 });
  }

  const { data: slots, error } = await supabase
    .from("time_slots")
    .select("id, time, is_booked")
    .eq("doctor_id", doctor_id)
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (slots || []).map((s: any) => ({
    id: s.id,
    time: s.time,
    display: formatTime(s.time),
    available: s.is_booked === false,
  }));

  return NextResponse.json(formatted);
}

function formatTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
