"use client";

import { useEffect, useState } from "react";
import { adminApi, type BackendSettings, ApiError } from "@/lib/api";
import { Save, Loader2 } from "lucide-react";

const inp = "w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon/60 transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BackendSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getSettings()
      .then((res) => setSettings(res.settings))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof BackendSettings>(key: K, val: BackendSettings[K]) => {
    setSettings((s) => s ? { ...s, [key]: val } : s);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const res = await adminApi.updateSettings({
        min_withdrawal: settings.min_withdrawal,
        max_daily_plays: settings.max_daily_plays,
        new_user_bonus: settings.new_user_bonus,
        auto_approve_withdrawals: settings.auto_approve_withdrawals,
        auto_approve_limit: settings.auto_approve_limit,
        payout_bank_name: settings.payout_bank_name,
        payout_account_name: settings.payout_account_name,
        payout_account_number: settings.payout_account_number,
      });
      setSettings(res.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-neon animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12 text-red-400">{error || "Failed to load settings"}</div>;
  }

  return (
    <div className="space-y-5 pb-24 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure game rules and platform defaults</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-5">

        {/* Game Rules */}
        <Section title="Game Rules">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min withdrawal (₦)">
              <input type="number" value={settings.min_withdrawal}
                onChange={(e) => update("min_withdrawal", Number(e.target.value))} className={inp} />
            </Field>
            <Field label="Max daily plays per user">
              <input type="number" value={settings.max_daily_plays}
                onChange={(e) => update("max_daily_plays", Number(e.target.value))} className={inp} />
            </Field>
          </div>
          <Field label="New user bonus (₦)">
            <div className="flex gap-2">
              {[0, 200, 500].map((v) => (
                <button key={v} onClick={() => update("new_user_bonus", v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    settings.new_user_bonus === v
                      ? "border-neon bg-neon/10 text-neon"
                      : "border-[#1E1E1E] text-gray-500 hover:border-neon/30"
                  }`}>
                  {v === 0 ? "None" : `₦${v}`}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Withdrawals */}
        <Section title="Withdrawals">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Auto-approve withdrawals</p>
              <p className="text-xs text-gray-500 mt-0.5">Under ₦{settings.auto_approve_limit.toLocaleString()}</p>
            </div>
            <button
              onClick={() => update("auto_approve_withdrawals", !settings.auto_approve_withdrawals)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${settings.auto_approve_withdrawals ? "bg-neon" : "bg-[#333]"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.auto_approve_withdrawals ? "left-6" : "left-1"}`} />
            </button>
          </div>
          <Field label="Auto-approve limit (₦)">
            <input type="number" value={settings.auto_approve_limit}
              onChange={(e) => update("auto_approve_limit", Number(e.target.value))}
              disabled={!settings.auto_approve_withdrawals}
              className={`${inp} disabled:opacity-40`} />
          </Field>
        </Section>

        {/* Payout Account — spans full width */}
        <div className="md:col-span-2">
          <Section title="Payout Account">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Bank name">
                <input type="text" placeholder="e.g. Opay" value={settings.payout_bank_name}
                  onChange={(e) => update("payout_bank_name", e.target.value)} className={inp} />
              </Field>
              <Field label="Account name">
                <input type="text" placeholder="e.g. BITLYFE Games" value={settings.payout_account_name}
                  onChange={(e) => update("payout_account_name", e.target.value)} className={inp} />
              </Field>
              <Field label="Account number">
                <input type="tel" placeholder="10-digit number" value={settings.payout_account_number}
                  onChange={(e) => update("payout_account_number", e.target.value)} className={inp} />
              </Field>
            </div>
          </Section>
        </div>

      </div>

      {/* Save */}
      <div className="sticky bottom-0 bg-[#0A0A0A]/90 backdrop-blur-md border-t border-[#1E1E1E] pt-4 pb-2 -mx-6 px-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-neon text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
