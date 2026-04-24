import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors (
        name,
        role,
        photo_url
      )
    `)
    .eq("id", id)
    .single();

  if (error || !appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Flatten the response to match the old structure
  const result = {
    ...appt,
    doctor_name: appt.doctors?.name,
    doctor_role: appt.doctors?.role,
    photo_url: appt.doctors?.photo_url,
  };
  
  return NextResponse.json(result);
}
