"use client";

import { useEffect, useState } from "react";
import { adminApi, type BackendSettings, ApiError } from "@/lib/api";
import { AlertTriangle, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<BackendSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingKill, setTogglingKill] = useState(false);
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
        entry_fee: settings.entry_fee,
        min_withdrawal: settings.min_withdrawal,
        max_daily_plays: settings.max_daily_plays,
        new_user_bonus: settings.new_user_bonus,
        auto_approve_withdrawals: settings.auto_approve_withdrawals,
        auto_approve_limit: settings.auto_approve_limit,
        game_name: settings.game_name,
        primary_color: settings.primary_color,
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

  const handleKillSwitch = async () => {
    if (!settings) return;
    const turning_on = !settings.game_kill_switch;
    if (turning_on && !confirm("Stop ALL active games? This affects live players.")) return;
    setTogglingKill(true);
    try {
      const res = await adminApi.toggleKillSwitch();
      setSettings((s) => s ? { ...s, game_kill_switch: res.gameKillSwitch } : s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kill switch failed");
    } finally {
      setTogglingKill(false);
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
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configure game rules and appearance</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm mb-6">{error}</div>
      )}

      {/* Scrollable content container with bottom padding for button */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-5 pb-24">
        {/* Game Rules */}
        <Section title="Game Rules">
          <Field label="Entry fee (₦)">
            <input type="number" value={settings.entry_fee}
              onChange={(e) => update("entry_fee", Number(e.target.value))}
              className="field-input" />
          </Field>
          <Field label="Min withdrawal (₦)">
            <input type="number" value={settings.min_withdrawal}
              onChange={(e) => update("min_withdrawal", Number(e.target.value))}
              className="field-input" />
          </Field>
          <Field label="Max daily plays per user">
            <input type="number" value={settings.max_daily_plays}
              onChange={(e) => update("max_daily_plays", Number(e.target.value))}
              className="field-input" />
          </Field>
          <Field label="New user bonus (₦)">
            <div className="flex gap-2">
              {[0, 200, 500].map((v) => (
                <button key={v} onClick={() => update("new_user_bonus", v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    settings.new_user_bonus === v ? "border-neon bg-neon/10 text-neon" : "border-[#2A2A2A] text-gray-400"
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
              <p className="text-xs text-gray-400 mt-0.5">
                Under ₦{settings.auto_approve_limit.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => update("auto_approve_withdrawals", !settings.auto_approve_withdrawals)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.auto_approve_withdrawals ? "bg-neon" : "bg-[#2A2A2A]"
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                settings.auto_approve_withdrawals ? "left-7" : "left-1"
              }`} />
            </button>
          </div>
          <Field label="Auto-approve limit (₦)">
            <input type="number" value={settings.auto_approve_limit}
              onChange={(e) => update("auto_approve_limit", Number(e.target.value))}
              disabled={!settings.auto_approve_withdrawals}
              className="field-input disabled:opacity-50" />
          </Field>
        </Section>

        {/* Payout Account */}
        <Section title="Payout Account">
          <Field label="Bank name">
            <input type="text" value={settings.payout_bank_name}
              onChange={(e) => update("payout_bank_name", e.target.value)}
              className="field-input" />
          </Field>
          <Field label="Account name">
            <input type="text" value={settings.payout_account_name}
              onChange={(e) => update("payout_account_name", e.target.value)}
              className="field-input" />
          </Field>
          <Field label="Account number">
            <input type="tel" value={settings.payout_account_number}
              onChange={(e) => update("payout_account_number", e.target.value)}
              className="field-input" />
          </Field>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <Field label="Game name">
            <input type="text" value={settings.game_name}
              onChange={(e) => update("game_name", e.target.value)}
              className="field-input" />
          </Field>
          <Field label="Primary color">
            <div className="flex items-center gap-3">
              <input type="color" value={settings.primary_color}
                onChange={(e) => update("primary_color", e.target.value)}
                className="w-12 h-10 rounded-lg border border-[#2A2A2A] bg-transparent cursor-pointer" />
              <span className="text-sm text-gray-300 font-mono">{settings.primary_color}</span>
            </div>
          </Field>
        </Section>

        {/* Kill Switch */}
        <div className={`rounded-2xl p-5 border ${
          settings.game_kill_switch ? "bg-red-900/20 border-red-700/40" : "bg-card border-[#2A2A2A]"
        }`}>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className={settings.game_kill_switch ? "text-red-400" : "text-gray-400"} />
            <div>
              <h3 className="text-white font-bold">Game Kill Switch</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Immediately pauses all games. Use in emergencies only.
              </p>
              {settings.game_kill_switch && (
                <p className="text-xs text-red-400 mt-1 font-semibold">⚠️ Games are currently STOPPED</p>
              )}
            </div>
          </div>
          <button
            onClick={handleKillSwitch}
            disabled={togglingKill}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
              settings.game_kill_switch ? "bg-neon text-black" : "bg-red-600 text-white hover:bg-red-500"
            }`}
          >
            {togglingKill ? <Loader2 size={16} className="animate-spin" /> : null}
            {settings.game_kill_switch ? "🟢 RESUME ALL GAMES" : "🔴 STOP ALL GAMES"}
          </button>
        </div>
      </div>

      {/* Save Button - Sticky at bottom */}
      <div className="flex-shrink-0 pt-4 border-t border-[#2A2A2A]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-neon text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "✅ Saved!" : saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
