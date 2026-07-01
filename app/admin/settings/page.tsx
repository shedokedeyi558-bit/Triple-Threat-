"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { AlertTriangle, Save } from "lucide-react";

export default function SettingsPage() {
  const { state, dispatch } = useAdmin();
  const s = state.settings;

  const update = (key: keyof typeof s, val: unknown) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: { [key]: val } });
  };

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configure game rules and appearance</p>
      </div>

      {/* Game Rules */}
      <Section title="Game Rules">
        <Field label="Entry fee (₦)">
          <input
            type="number"
            value={s.entryFee}
            onChange={(e) => update("entryFee", Number(e.target.value))}
            className="field-input"
          />
        </Field>
        <Field label="Min withdrawal (₦)">
          <input
            type="number"
            value={s.minWithdrawal}
            onChange={(e) => update("minWithdrawal", Number(e.target.value))}
            className="field-input"
          />
        </Field>
        <Field label="Max daily plays per user">
          <input
            type="number"
            value={s.maxDailyPlays}
            onChange={(e) => update("maxDailyPlays", Number(e.target.value))}
            className="field-input"
          />
        </Field>
        <Field label="New user bonus (₦)">
          <div className="flex gap-2">
            {[0, 200, 500].map((v) => (
              <button
                key={v}
                onClick={() => update("newUserBonus", v)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  s.newUserBonus === v ? "border-neon bg-neon/10 text-neon" : "border-[#2A2A2A] text-gray-400"
                }`}
              >
                {v === 0 ? "None" : `₦${v}`}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Payout Account */}
      <Section title="Payout Account">
        <Field label="Bank name">
          <input
            type="text"
            value={s.payoutBankName}
            onChange={(e) => update("payoutBankName", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Account name">
          <input
            type="text"
            value={s.payoutAccountName}
            onChange={(e) => update("payoutAccountName", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Account number">
          <input
            type="tel"
            value={s.payoutAccountNumber}
            onChange={(e) => update("payoutAccountNumber", e.target.value)}
            className="field-input"
          />
        </Field>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Field label="Game name">
          <input
            type="text"
            value={s.gameName}
            onChange={(e) => update("gameName", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Primary color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={s.primaryColor}
              onChange={(e) => update("primaryColor", e.target.value)}
              className="w-12 h-10 rounded-lg border border-[#2A2A2A] bg-transparent cursor-pointer"
            />
            <span className="text-sm text-gray-300 font-mono">{s.primaryColor}</span>
          </div>
        </Field>
        <Field label="Logo upload">
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#2A2A2A] hover:border-neon text-gray-400 hover:text-white cursor-pointer transition-colors text-sm font-medium">
            📷 Upload PNG
            <input type="file" accept="image/png,image/jpeg" className="hidden" />
          </label>
        </Field>
      </Section>

      {/* Kill Switch */}
      <div className={`rounded-2xl p-5 border ${s.gameKillSwitch ? "bg-red-900/20 border-red-700/40" : "bg-card border-[#2A2A2A]"}`}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={20} className={s.gameKillSwitch ? "text-red-400" : "text-gray-400"} />
          <div>
            <h3 className="text-white font-bold">Game Kill Switch</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Immediately pauses all active games. Use in emergencies only.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (!s.gameKillSwitch) {
              if (!confirm("Are you sure? This will stop all active games immediately.")) return;
            }
            update("gameKillSwitch", !s.gameKillSwitch);
          }}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            s.gameKillSwitch
              ? "bg-neon text-black"
              : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          {s.gameKillSwitch ? "🟢 RESUME ALL GAMES" : "🔴 STOP ALL GAMES"}
        </button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl bg-neon text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        {saved ? "✅ Saved!" : <><Save size={16} /> Save Settings</>}
      </button>
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
