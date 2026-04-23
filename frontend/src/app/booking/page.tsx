"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  User,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  X,
} from "lucide-react";

const API = "/api";

const DOCTORS = [
  {
    id: 1,
    name: "Mr. Praveen Ravi",
    role: "Founder & Counselling Psychologist",
    photo: "/doctors/praveen-ravi.jpeg",
  },
  { id: 2, name: "Dr. Pavithra S", role: "General Physician", photo: "/doctors/pavithra.jpeg" },
  {
    id: 3,
    name: "Ms. Nivetha S",
    role: "Counselling Psychologist",
    photo: "/doctors/nivetha.jpeg",
  },
  {
    id: 4,
    name: "Ms. M. Yalini",
    role: "Psychologist",
    photo: "/doctors/yalini.jpeg",
  },
  {
    id: 5,
    name: "Ms. Krupa Elsa Abraham",
    role: "Social Worker & Counsellor",
    photo: "/doctors/krupa.jpeg",
  },
];

interface Slot {
  id: number;
  time: string;
  display: string;
  available: boolean;
}

interface BookingResult {
  appointment_id: number;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function getMinDate() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function BookingContent() {
  const searchParams = useSearchParams();

  const preselectedDoctorId = searchParams.get("doctor")
    ? parseInt(searchParams.get("doctor")!)
    : 0;

  const [step, setStep] = useState(1);
  const [doctorId, setDoctorId] = useState(preselectedDoctorId || 0);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);

  const selectedDoctor = DOCTORS.find((d) => d.id === doctorId);

  // Auto-advance to step 2 if doctor preselected
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preselectedDoctorId > 0) setDoctorId(preselectedDoctorId);
  }, [preselectedDoctorId]);

  // Fetch slots when doctor + date selected
  useEffect(() => {
    if (!doctorId || !selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    fetch(`${API}/slots?doctor_id=${doctorId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlots([]);
        setSlotsLoading(false);
      });
  }, [doctorId, selectedDate]);

  const handleBook = async () => {
    if (!form.name || !form.phone) {
      setError("Name and phone number are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: form.name,
          patient_phone: form.phone,
          patient_email: form.email,
          doctor_id: doctorId,
          appointment_date: selectedDate,
          appointment_time: selectedSlot!.time,
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setResult(data);
      setStep(5); // Confirmation
    } catch {
      setError("Network error. Please check your connection.");
    }
    setSubmitting(false);
  };

  const stepLabels = ["Doctor", "Date & Slot", "Your Details", "Confirm"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f4fd] via-[#f0f9f4] to-white">
      {step < 5 && (
        <section className="bg-gradient-to-br from-[#e8f4fd] to-[#f0f9f4] py-14 px-4 text-center">
          <span className="text-[#A8D5BA] font-bold text-sm uppercase tracking-widest">
            📅 Appointment
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1e293b] mt-3 mb-4">
            Book Your Session
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Complete all steps to schedule your online counselling session.
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mt-8 max-w-lg mx-auto">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const active = step === num;
              const done = step > num;
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? "bg-[#A8D5BA] text-white" : active ? "bg-[#4A90E2] text-white shadow-lg shadow-blue-200" : "bg-gray-200 text-gray-500"}`}
                    >
                      {done ? <CheckCircle2 size={16} /> : num}
                    </div>
                    <span
                      className={`text-xs font-semibold ${active ? "text-[#4A90E2]" : "text-gray-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-1 mb-5 transition-colors ${done ? "bg-[#A8D5BA]" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* ── STEP 1: Choose Doctor ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1e293b] mb-6 flex items-center gap-2">
              <User className="text-[#4A90E2]" size={22} /> Choose Your
              Counsellor
            </h2>
            <div className="space-y-3">
              {DOCTORS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDoctorId(d.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${doctorId === d.id ? "border-[#4A90E2] bg-[#f0f9ff]" : "border-gray-100 hover:border-[#4A90E2]/40 hover:bg-gray-50"}`}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {d.photo ? (
                      <Image
                        src={d.photo}
                        alt={d.name}
                        fill
                        className="object-cover object-top"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        👩‍⚕️
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1e293b]">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.role}</p>
                  </div>
                  {doctorId === d.id && (
                    <CheckCircle2
                      className="text-[#4A90E2] shrink-0"
                      size={20}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              disabled={!doctorId}
              onClick={() => setStep(2)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all"
            >
              Next: Select Date & Time <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Select Date & Slot ──────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#4A90E2] mb-5 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-[#1e293b] mb-2 flex items-center gap-2">
              <Calendar className="text-[#4A90E2]" size={22} /> Select Date &
              Time
            </h2>
            {selectedDoctor && (
              <p className="text-sm text-gray-500 mb-6">
                for <strong>{selectedDoctor.name}</strong>
              </p>
            )}

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Select Date
            </label>
            <input
              type="date"
              min={getMinDate()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all mb-6"
            />

            {selectedDate && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-[#4A90E2]" />
                  <span className="font-semibold text-[#1e293b]">
                    Available Slots — {formatDate(selectedDate)}
                  </span>
                </div>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
                    <Loader2 className="animate-spin" size={22} /> Loading
                    slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="font-medium">
                      No slots available on this date.
                    </p>
                    <p className="text-sm mt-1">
                      Try selecting a different date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-6">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          !slot.available
                            ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                            : selectedSlot?.id === slot.id
                              ? "bg-[#4A90E2] border-[#4A90E2] text-white shadow-md shadow-blue-200"
                              : "bg-white border-gray-200 text-gray-700 hover:border-[#4A90E2] hover:text-[#4A90E2]"
                        }`}
                      >
                        {slot.display}
                        {!slot.available && (
                          <span className="block text-[9px] mt-0.5">
                            Booked
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 text-xs text-gray-400 mb-6">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#4A90E2]" /> Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-white border-2 border-gray-200" />{" "}
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-100" />{" "}
                    Booked
                  </span>
                </div>
              </>
            )}

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
              className="w-full flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all"
            >
              Next: Your Details <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 3: Patient Details ─────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#4A90E2] mb-5 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-[#1e293b] mb-6 flex items-center gap-2">
              <User className="text-[#4A90E2]" size={22} /> Your Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} /> Mobile Number *{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (for WhatsApp confirmation)
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 XXXXXXXXXX"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Reason / Concern
                </label>
                <textarea
                  rows={4}
                  placeholder="Briefly describe what you would like support with..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all resize-none"
                />
              </div>
            </div>

            <button
              disabled={!form.name || !form.phone}
              onClick={() => setStep(4)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all"
            >
              Review & Confirm <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── STEP 4: Confirm ────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#4A90E2] mb-5 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-2xl font-bold text-[#1e293b] mb-6">
              📋 Confirm Booking
            </h2>

            <div className="bg-[#f0f9ff] rounded-2xl border border-[#4A90E2]/20 p-6 space-y-4 mb-6">
              {[
                { label: "Counsellor", value: selectedDoctor?.name },
                { label: "Role", value: selectedDoctor?.role },
                { label: "Date", value: formatDate(selectedDate) },
                { label: "Time", value: selectedSlot?.display },
                { label: "Patient Name", value: form.name },
                { label: "Phone", value: form.phone },
                { label: "Email", value: form.email || "—" },
                { label: "Reason", value: form.reason || "Not specified" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="text-sm text-gray-400 font-semibold w-32 shrink-0">
                    {label}
                  </span>
                  <span className="text-sm text-[#1e293b] font-medium flex-1">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-6 text-center">
              A WhatsApp confirmation will be sent to {form.phone} after
              booking.
            </p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
                <X size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-blue-300 text-white font-bold py-4 rounded-full shadow-lg shadow-blue-200 transition-all hover:scale-[1.01]"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Booking...
                </>
              ) : (
                "✅ Confirm Appointment"
              )}
            </button>
          </div>
        )}

        {/* ── STEP 5: Confirmation ───────────────────────────────────────── */}
        {step === 5 && result && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
            {/* Success Animation */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#A8D5BA]/20 flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="text-[#A8D5BA]" size={56} />
                </div>
                <div className="absolute -top-1 -right-1 text-2xl">✨</div>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-[#1e293b] mb-2">
              Booking Confirmed! 🎉
            </h2>
            <p className="text-gray-500 mb-8">
              Your counselling session has been successfully booked.
            </p>

            <div className="bg-gradient-to-br from-[#f0f9ff] to-[#f0fdf4] rounded-2xl border border-gray-100 p-6 text-left space-y-3 mb-6 max-w-md mx-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-semibold">
                  Appointment ID
                </span>
                <span className="font-bold text-[#4A90E2]">
                  #{result.appointment_id}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-semibold">Counsellor</span>
                <span className="font-semibold text-[#1e293b]">
                  {result.doctor_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-semibold">Date</span>
                <span className="font-semibold text-[#1e293b]">
                  {formatDate(result.appointment_date)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-semibold">Time</span>
                <span className="font-semibold text-[#1e293b]">
                  {formatTime(result.appointment_time)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-semibold">Patient</span>
                <span className="font-semibold text-[#1e293b]">
                  {result.patient_name}
                </span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-8 max-w-md mx-auto">
              💬 A WhatsApp confirmation has been sent to your mobile number.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/qr/TCJFIYJ4T7Q3F1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                💬 Message on WhatsApp
              </a>
              <button
                onClick={() => {
                  setStep(1);
                  setDoctorId(0);
                  setSelectedDate("");
                  setSlots([]);
                  setSelectedSlot(null);
                  setForm({ name: "", phone: "", email: "", reason: "" });
                  setResult(null);
                }}
                className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Book Another Session
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#2563eb] text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                Go to Home
              </Link>
            </div>
          </div>
        )}

        {/* Or contact directly */}
        {step < 5 && (
          <div className="text-center mt-6 text-sm text-gray-400">
            Or contact us directly:&nbsp;
            <a
              href="tel:+919159715236"
              className="text-[#4A90E2] font-semibold hover:underline"
            >
              📞 +91 9159715236
            </a>
            &nbsp;·&nbsp;
            <a
              href="https://wa.me/919159715236"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-semibold hover:underline"
            >
              💬 WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#4A90E2]" size={40} />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
