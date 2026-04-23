"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";

const API = "/api";

interface Stats {
  totalAppointments: number;
  todayAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  upcomingAppointments: number;
  totalDoctors: number;
}

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  doctor_name: string;
  doctor_role: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: string;
  created_at: string;
}

interface Doctor {
  id: number;
  name: string;
  qualification: string;
  role: string;
  photo_url: string;
  languages: string;
  timings: string;
  appointment_count: number;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "appointments" | "doctors"
  >("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    qualification: "",
    role: "",
    specialization: "",
    description: "",
    languages: "",
    timings: "17:00-22:00",
    phone: "",
  });
  const [addingDoctor, setAddingDoctor] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const apiFetch = useCallback(
    async (url: string, opts?: RequestInit) => {
      const res = await fetch(url, {
        ...opts,
        headers: {
          ...(opts?.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    [token, router],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, d] = await Promise.all([
        apiFetch(`${API}/admin/stats`),
        apiFetch(`${API}/admin/appointments`),
        apiFetch(`${API}/admin/doctors`),
      ]);
      setStats(s);
      setAppointments(a);
      setDoctors(d);
    } catch {
      /* handled in apiFetch */
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [token, router, loadDashboard]);

  const handleCancel = async (id: number) => {
    if (!confirm(`Cancel appointment #${id}?`)) return;
    setCancelling(id);
    await apiFetch(`${API}/appointments/${id}/cancel`, { method: "PATCH" });
    await loadDashboard();
    setCancelling(null);
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name) return;
    setAddingDoctor(true);
    await apiFetch(`${API}/doctors`, {
      method: "POST",
      body: JSON.stringify(newDoctor),
    });
    setAddDoctorOpen(false);
    setNewDoctor({
      name: "",
      qualification: "",
      role: "",
      specialization: "",
      description: "",
      languages: "",
      timings: "17:00-22:00",
      phone: "",
    });
    await loadDashboard();
    setAddingDoctor(false);
  };

  const handleRemoveDoctor = async (id: number, name: string) => {
    if (!confirm(`Remove Dr. ${name} and all their time slots?`)) return;
    await apiFetch(`${API}/doctors/${id}`, { method: "DELETE" });
    await loadDashboard();
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchSearch =
      !search ||
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.patient_phone.includes(search);
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4A90E2]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#1e293b] text-white px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4A90E2] flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Revathy Mind Care</p>
            <p className="text-[10px] text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-56 bg-white border-r border-gray-100 shrink-0 hidden md:flex flex-col py-6">
          {[
            { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            {
              key: "appointments",
              icon: Calendar,
              label: `Appointments${stats ? ` (${stats.confirmedAppointments})` : ""}`,
            },
            { key: "doctors", icon: Users, label: "Doctors" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() =>
                setActiveTab(key as "dashboard" | "appointments" | "doctors")
              }
              className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-all ${activeTab === key ? "bg-[#4A90E2]/10 text-[#4A90E2] border-r-2 border-[#4A90E2]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
          {[
            { key: "dashboard", icon: LayoutDashboard, label: "Home" },
            { key: "appointments", icon: Calendar, label: "Bookings" },
            { key: "doctors", icon: Users, label: "Doctors" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() =>
                setActiveTab(key as "dashboard" | "appointments" | "doctors")
              }
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${activeTab === key ? "text-[#4A90E2]" : "text-gray-400"}`}
            >
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          {/* ── DASHBOARD TAB ──────────────────────────────────────────── */}
          {activeTab === "dashboard" && stats && (
            <div>
              <h1 className="text-2xl font-extrabold text-[#1e293b] mb-6">
                Overview
              </h1>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    label: "Today's Appointments",
                    value: stats.todayAppointments,
                    color: "#4A90E2",
                    bg: "from-blue-50",
                    icon: "📅",
                  },
                  {
                    label: "Upcoming Sessions",
                    value: stats.upcomingAppointments,
                    color: "#22c55e",
                    bg: "from-green-50",
                    icon: "⏰",
                  },
                  {
                    label: "Total Bookings",
                    value: stats.totalAppointments,
                    color: "#7c3aed",
                    bg: "from-purple-50",
                    icon: "📊",
                  },
                  {
                    label: "Confirmed",
                    value: stats.confirmedAppointments,
                    color: "#A8D5BA",
                    bg: "from-emerald-50",
                    icon: "✅",
                  },
                  {
                    label: "Cancelled",
                    value: stats.cancelledAppointments,
                    color: "#e11d48",
                    bg: "from-red-50",
                    icon: "❌",
                  },
                  {
                    label: "Total Doctors",
                    value: stats.totalDoctors,
                    color: "#f59e0b",
                    bg: "from-amber-50",
                    icon: "👨‍⚕️",
                  },
                ].map(({ label, value, color, bg, icon }) => (
                  <div
                    key={label}
                    className={`bg-gradient-to-br ${bg} to-white rounded-2xl p-5 border border-gray-100 shadow-sm`}
                  >
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="text-3xl font-extrabold" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Appointments */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-[#1e293b]">
                    Recent Appointments
                  </h2>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="text-[#4A90E2] text-sm font-semibold hover:underline"
                  >
                    View all →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Patient", "Doctor", "Date", "Time", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {appointments.slice(0, 5).map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-[#1e293b]">
                            {a.patient_name}
                            <br />
                            <span className="text-xs text-gray-400 font-normal">
                              {a.patient_phone}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {a.doctor_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(a.appointment_date)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatTime(a.appointment_time)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${a.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                            >
                              {a.status === "confirmed" ? (
                                <CheckCircle2 size={11} />
                              ) : (
                                <XCircle size={11} />
                              )}
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {appointments.length === 0 && (
                    <p className="text-center py-8 text-gray-400">
                      No appointments yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS TAB ───────────────────────────────────────── */}
          {activeTab === "appointments" && (
            <div>
              <h1 className="text-2xl font-extrabold text-[#1e293b] mb-4">
                All Appointments
              </h1>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="sm:w-40 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#4A90E2] bg-white"
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          "#",
                          "Patient",
                          "Doctor",
                          "Date & Time",
                          "Reason",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAppointments.map((a) => (
                        <tr key={a.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                            #{a.id}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#1e293b]">
                              {a.patient_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {a.patient_phone}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {a.doctor_name}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-xs text-[#1e293b]">
                              {formatDate(a.appointment_date)}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(a.appointment_time)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                            {a.reason || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${a.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                            >
                              {a.status === "confirmed" ? (
                                <CheckCircle2 size={11} />
                              ) : (
                                <XCircle size={11} />
                              )}
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {a.status === "confirmed" && (
                              <button
                                onClick={() => handleCancel(a.id)}
                                disabled={cancelling === a.id}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {cancelling === a.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <X size={12} />
                                )}
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAppointments.length === 0 && (
                    <p className="text-center py-10 text-gray-400">
                      No appointments found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── DOCTORS TAB ────────────────────────────────────────────── */}
          {activeTab === "doctors" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-extrabold text-[#1e293b]">
                  Manage Doctors
                </h1>
                <button
                  onClick={() => setAddDoctorOpen(true)}
                  className="flex items-center gap-1.5 bg-[#4A90E2] hover:bg-[#2563eb] text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                  <Plus size={15} /> Add Doctor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-[#e8f4fd] to-[#f0f9f4]">
                      {d.photo_url && d.photo_url.startsWith("/doctors/") ? (
                        <Image
                          src={d.photo_url}
                          alt={d.name}
                          fill
                          className="object-cover object-top"
                          sizes="300px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          👨‍⚕️
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#1e293b]">{d.name}</h3>
                      <p className="text-xs text-[#4A90E2] font-semibold mb-1">
                        {d.qualification}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">{d.role}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-50 text-[#4A90E2] px-2.5 py-1 rounded-full font-semibold">
                          {d.appointment_count} appointments
                        </span>
                        <button
                          onClick={() => handleRemoveDoctor(d.id, d.name)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Doctor Modal */}
      {addDoctorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAddDoctorOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-[#1e293b] mb-5">
              Add New Doctor
            </h2>
            <div className="space-y-3">
              {[
                {
                  key: "name",
                  label: "Full Name *",
                  placeholder: "Dr. / Mr. / Ms. Full Name",
                },
                {
                  key: "qualification",
                  label: "Qualification",
                  placeholder: "MBBS / M.SC / MSW",
                },
                {
                  key: "role",
                  label: "Role / Designation",
                  placeholder: "Counselling Psychologist",
                },
                {
                  key: "specialization",
                  label: "Specializations",
                  placeholder: "Anxiety Counselling, Stress Management",
                },
                {
                  key: "languages",
                  label: "Languages",
                  placeholder: "English, Tamil, Hindi",
                },
                {
                  key: "timings",
                  label: "Timings (24hr)",
                  placeholder: "17:00-22:00",
                },
                {
                  key: "phone",
                  label: "WhatsApp Number",
                  placeholder: "+91 XXXXXXXXXX",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(newDoctor as Record<string, string>)[key]}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, [key]: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief professional bio..."
                  value={newDoctor.description}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, description: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 transition-all resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleAddDoctor}
              disabled={addingDoctor || !newDoctor.name}
              className="mt-5 w-full bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {addingDoctor ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Adding...
                </>
              ) : (
                <>
                  <Plus size={16} /> Add Doctor
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
