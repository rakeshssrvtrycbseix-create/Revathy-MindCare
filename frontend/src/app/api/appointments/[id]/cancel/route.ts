import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: appt, error: findError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  // 1. Update appointment status
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 2. Free up the slot
  const { error: slotError } = await supabase
    .from("time_slots")
    .update({ is_booked: false })
    .match({
      doctor_id: appt.doctor_id,
      date: appt.appointment_date,
      time: appt.appointment_time
    });

  if (slotError) {
    console.error("Error freeing slot:", slotError);
  }

  return NextResponse.json({ message: "Appointment cancelled and slot freed" });
}
