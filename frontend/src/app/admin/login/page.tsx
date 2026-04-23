"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid password");
        setLoading(false);
        return;
      }
      localStorage.setItem("admin_token", data.token);
      router.push("/admin/dashboard");
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e3a5f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4A90E2]/20 border border-[#4A90E2]/30 mb-4">
            <Lock className="text-[#4A90E2]" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">
            Admin Portal
          </h1>
          <p className="text-gray-400">Revathy Mind Care — Staff Access</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8"
        >
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Admin Password
          </label>
          <div className="relative mb-4">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-[#4A90E2] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#4A90E2] hover:bg-[#2563eb] disabled:bg-[#4A90E2]/40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Logging in...
              </>
            ) : (
              "🔑 Login to Dashboard"
            )}
          </button>

          <p className="text-center text-gray-500 text-xs mt-6">
            Default password: <code className="text-[#A8D5BA]">admin123</code>
            <br />
            (Change in backend <code className="text-[#A8D5BA]">.env</code>{" "}
            file)
          </p>
        </form>
      </div>
    </div>
  );
}
