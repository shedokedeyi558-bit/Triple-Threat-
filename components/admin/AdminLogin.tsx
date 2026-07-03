"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { Lock, Mail } from "lucide-react";
import { authApi, setAdminToken, ApiError } from "@/lib/api";

export function AdminLogin() {
  const router = useRouter();
  const { dispatch: adminDispatch } = useAdmin();
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
      
      adminDispatch({ type: "ADMIN_LOGIN", token: data.token });
      
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-black uppercase tracking-tight text-3xl leading-none mb-1">
            <span className="text-white">BIT</span>
            <span className="text-neon neon-text-glow">LYFE</span>
          </div>
          <div className="text-gray-400 text-sm">Admin Panel</div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
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
                className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
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
            className="w-full py-3 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
            ) : (
              "Login to Admin"
            )}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Admin login only. Unauthorized access attempts will be logged.
        </p>
      </div>
    </div>
  );
}
