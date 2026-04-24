import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendBookingEmails } from "@/lib/email";

export async function POST(req: Request) {
  const {
    patient_name,
    patient_phone,
    patient_email,
    doctor_id,
    appointment_date,
    appointment_time,
    reason,
  } = await req.json();

  if (!patient_name || !patient_phone || !doctor_id || !appointment_date || !appointment_time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Try to mark the slot as booked atomically
  // This prevents double booking even without an explicit transaction block
  const { data: updatedSlot, error: slotError } = await supabase
    .from("time_slots")
    .update({ is_booked: true })
    .match({ 
      doctor_id: doctor_id, 
      date: appointment_date, 
      time: appointment_time,
      is_booked: false 
    })
    .select()
    .single();

  if (slotError || !updatedSlot) {
    return NextResponse.json(
      { error: "This time slot is no longer available. Please choose another." },
      { status: 409 }
    );
  }

  // 2. Insert the appointment
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .insert([
      {
        patient_name,
        patient_phone,
        patient_email: patient_email || "",
        doctor_id,
        appointment_date,
        appointment_time,
        reason: reason || "",
        status: "confirmed",
      },
    ])
    .select()
    .single();

  if (apptError) {
    // Rollback slot if appointment fails
    await supabase.from("time_slots").update({ is_booked: false }).eq("id", updatedSlot.id);
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // 3. Get doctor details for Email
  const { data: doctor } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", doctor_id)
    .single();

  if (doctor) {
    // Send email notifications (async, non-blocking)
    sendBookingEmails({
      patientName: patient_name,
      patientPhone: patient_phone,
      patientEmail: patient_email || "",
      doctorName: doctor.name,
      doctorRole: doctor.role,
      appointmentDate: appointment_date,
      appointmentTime: appointment_time,
      reason: reason || "",
      appointmentId: appointment.id,
    }).catch((e) => console.error("Email error:", e.message));
  }

  return NextResponse.json({
    message: "Appointment booked successfully!",
    appointment_id: appointment.id,
    patient_name,
    doctor_name: doctor?.name || "Doctor",
    appointment_date,
    appointment_time,
    status: "confirmed",
  }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const doctor_id = searchParams.get("doctor_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctors (
        name,
        role,
        photo_url
      )
    `);

  if (date) query = query.eq("appointment_date", date);
  if (doctor_id) query = query.eq("doctor_id", doctor_id);
  if (status) query = query.eq("status", status);

  const { data: appointments, error } = await query.order("appointment_date", { ascending: false }).order("appointment_time", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the response to match the old SQLite structure if needed
  const result = (appointments || []).map((a: any) => ({
    ...a,
    doctor_name: a.doctors?.name,
    doctor_role: a.doctors?.role,
    photo_url: a.doctors?.photo_url,
  }));

  return NextResponse.json(result);
}
