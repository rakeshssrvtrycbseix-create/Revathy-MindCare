// frontend/scripts/seed-slots.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Anon Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSlots() {
  console.log("🚀 Starting Slot Seeding...");

  // 0. Seed doctors if empty
  const { count, error: countError } = await supabase.from("doctors").select("*", { count: "exact", head: true });
  if (count === 0) {
    console.log("👨‍⚕️ No doctors found. Seeding default doctors...");
    const doctorsToSeed = [
      {
        name: "Mr. Praveen Ravi",
        qualification: "M.A., B.Lib., M.Lib.ISc., M.SC",
        role: "Founder & Counselling Psychologist",
        specialization: "Individual Counselling, Mental Health Awareness, Psychological Assessment",
        description: "Mr. Praveen Ravi is the founder of Revathy Mind Care, committed to promoting mental health awareness and providing accessible psychological support.",
        photo_url: "/doctors/praveen-ravi.jpeg",
        languages: "English,Tamil",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        timings: "17:00-22:00",
        phone: "+919159715236",
      },
      {
        name: "Dr. Pavithra S",
        qualification: "MBBS",
        role: "General Physician",
        specialization: "Medical Support, Health Assessment, Wellness Guidance",
        description: "Dr. Pavithra S is a qualified General Physician providing medical support and wellness guidance at Revathy Mind Care.",
        photo_url: "/doctors/pavithra.jpeg",
        languages: "English,Tamil",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
        timings: "17:00-22:00",
        phone: "+919159715236",
      },
      {
        name: "Ms. Nivetha S",
        qualification: "M.SC",
        role: "Counselling Psychologist",
        specialization: "Anxiety Counselling, Student Counselling, Stress Management",
        description: "Ms. Nivetha S is a dedicated Counselling Psychologist specializing in anxiety management, student counselling, and stress management.",
        photo_url: "/doctors/nivetha.jpeg",
        languages: "English,Tamil",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        timings: "17:00-22:00",
        phone: "+919159715236",
      },
      {
        name: "Ms. M. Yalini",
        qualification: "M.SC",
        role: "Psychologist",
        specialization: "Relationship Counselling, Adolescent Counselling, Career Counselling",
        description: "Ms. M. Yalini is a multilingual Psychologist fluent in English, Tamil, and Hindi.",
        photo_url: "/doctors/yalini.jpeg",
        languages: "English,Tamil,Hindi",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        timings: "17:00-22:00",
        phone: "+919159715236",
      },
      {
        name: "Ms. Krupa Elsa Abraham",
        qualification: "MSW",
        role: "Social Worker & Counsellor",
        specialization: "Social Support, Parenting Guidance, Group Counselling",
        description: "Ms. Krupa Elsa Abraham is a qualified Social Worker and Counsellor bringing a unique social work perspective to mental health support.",
        photo_url: "/doctors/krupa.jpeg",
        languages: "English,Malayalam",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        timings: "17:00-22:00",
        phone: "+919159715236",
      }
    ];
    const { error: seedError } = await supabase.from("doctors").insert(doctorsToSeed);
    if (seedError) {
      console.error("❌ Error seeding doctors:", seedError);
    } else {
      console.log("✅ Seeded 5 doctors.");
    }
  }

  // 1. Get all doctors
  const { data: doctors, error: fetchError } = await supabase.from("doctors").select("id, available_days, timings");
  
  if (fetchError || !doctors) {
    console.error("❌ Error fetching doctors:", fetchError);
    return;
  }

  console.log(`👨‍⚕️ Found ${doctors.length} doctors. Generating slots for 60 days...`);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  let totalGenerated = 0;

  for (const doc of doctors) {
    const [startHour, endHour] = (doc.timings || "17:00-22:00").split("-").map((t) => parseInt(t.split(":")[0]));
    const availDaySet = new Set((doc.available_days || "").split(","));
    const slotsToInsert = [];

    for (let d = 0; d < 60; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dayName = dayNames[date.getDay()];
      
      if (!availDaySet.has(dayName)) continue;
      
      const dateStr = date.toISOString().split("T")[0];
      const actualStart = dayName === "Sunday" ? 10 : startHour;

      for (let h = actualStart; h < endHour; h++) {
        for (let m = 0; m < 60; m += 30) {
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          slotsToInsert.push({
            doctor_id: doc.id,
            date: dateStr,
            time: timeStr,
            is_booked: false
          });
        }
      }
    }

    // Insert in batches of 1000 to avoid request size limits
    for (let i = 0; i < slotsToInsert.length; i += 1000) {
      const batch = slotsToInsert.slice(i, i + 1000);
      const { error: insertError } = await supabase.from("time_slots").upsert(batch, { onConflict: "doctor_id,date,time" });
      if (insertError) {
        console.error(`❌ Error inserting slots for doctor ${doc.id}:`, insertError);
      }
    }
    
    console.log(`✅ Generated slots for doctor ID: ${doc.id}`);
    totalGenerated += slotsToInsert.length;
  }

  console.log(`✨ DONE! Total slots generated/updated: ${totalGenerated}`);
}

seedSlots();
