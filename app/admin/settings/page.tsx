"use client";

import { useEffect, useState } from "react";
import { adminApi, type BackendSettings, ApiError } from "@/lib/api";
import { Save, Loader2 } from "lucide-react";

const inp = "w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5 space-y-4 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
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
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12" style={{ color: "#ef4444" }}>{error || "Failed to load settings"}</div>;
  }

  return (
    <div className="space-y-5 pb-24 max-w-3xl">
      <div>
        <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Configure game rules and platform defaults
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-3 border text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "rgba(239, 68, 68, 0.05)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">

        {/* Game Rules */}
        <Section title="Game Rules">
          <Field label="Min withdrawal (₦)">
            <input 
              type="number" 
              value={settings.min_withdrawal}
              onChange={(e) => update("min_withdrawal", Number(e.target.value))} 
              className={inp}
              style={{ 
                backgroundColor: "var(--bg-base)", 
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                border: "1px solid",
              }}
            />
          </Field>
        </Section>

        {/* Withdrawals */}
        <Section title="Withdrawals">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Auto-approve withdrawals
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Under ₦{settings.auto_approve_limit.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => update("auto_approve_withdrawals", !settings.auto_approve_withdrawals)}
              className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              style={{
                backgroundColor: settings.auto_approve_withdrawals ? "var(--accent-indigo)" : "var(--border-subtle)"
              }}
            >
              <span 
                className="absolute top-1 w-4 h-4 rounded-full shadow transition-all"
                style={{
                  backgroundColor: "#fff",
                  left: settings.auto_approve_withdrawals ? "24px" : "4px"
                }}
              />
            </button>
          </div>
          <Field label="Auto-approve limit (₦)">
            <input 
              type="number" 
              value={settings.auto_approve_limit}
              onChange={(e) => update("auto_approve_limit", Number(e.target.value))}
              disabled={!settings.auto_approve_withdrawals}
              className={`${inp} disabled:opacity-40`}
              style={{ 
                backgroundColor: "var(--bg-base)", 
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                border: "1px solid",
              }}
            />
          </Field>
        </Section>

        {/* Payout Account — spans full width */}
        <div className="md:col-span-2">
          <Section title="Payout Account">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Bank name">
                <input 
                  type="text" 
                  placeholder="e.g. Opay" 
                  value={settings.payout_bank_name}
                  onChange={(e) => update("payout_bank_name", e.target.value)}
                  className={inp}
                  style={{ 
                    backgroundColor: "var(--bg-base)", 
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid",
                  }}
                />
              </Field>
              <Field label="Account name">
                <input 
                  type="text" 
                  placeholder="e.g. BITLYFE Games" 
                  value={settings.payout_account_name}
                  onChange={(e) => update("payout_account_name", e.target.value)}
                  className={inp}
                  style={{ 
                    backgroundColor: "var(--bg-base)", 
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid",
                  }}
                />
              </Field>
              <Field label="Account number">
                <input 
                  type="tel" 
                  placeholder="10-digit number" 
                  value={settings.payout_account_number}
                  onChange={(e) => update("payout_account_number", e.target.value)}
                  className={inp}
                  style={{ 
                    backgroundColor: "var(--bg-base)", 
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid",
                  }}
                />
              </Field>
            </div>
          </Section>
        </div>

      </div>

      {/* Save */}
      <div className="sticky bottom-0 border-t pt-4 pb-2 -mx-6 px-6" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" + "e6", backdropFilter: "blur(12px)" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
          style={{ 
            backgroundColor: "var(--accent-indigo)",
            color: "#fff"
          }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
