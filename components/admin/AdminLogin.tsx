"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Lock, Mail } from "lucide-react";
import { authApi, setAdminToken, ApiError } from "@/lib/api";

export function AdminLogin() {
  const { dispatch } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authApi.adminLogin(email.trim(), password);
      setAdminToken(data.token);
      dispatch({ type: "ADMIN_LOGIN", token: data.token });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-neon font-black text-3xl uppercase">Triple Threat</div>
          <div className="text-gray-400 text-sm mt-1">Admin Panel</div>
        </div>

        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="admin@triplethreat.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
            ) : (
              "Login to Admin"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
