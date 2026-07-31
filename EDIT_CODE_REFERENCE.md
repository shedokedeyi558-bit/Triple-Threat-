# Blitz Detail Edit Feature — Code Reference

## Quick Copy-Paste Reference

### State Variables (Add to AdminBlitzDetailPage)
```typescript
// Edit state for detail fields
const [editMode, setEditMode] = useState(false);
const [editData, setEditData] = useState<{
  entry_fee: number;
  question_count: number;
  max_participants: number | null;
  registration_deadline: string;
} | null>(null);
const [editError, setEditError] = useState("");
const [editSaving, setEditSaving] = useState(false);
```

---

### Handler Functions

```typescript
const handleEditClick = () => {
  if (t && (t.total_registered === 0)) {
    setEditData({
      entry_fee: t.entry_fee,
      question_count: t.question_count,
      max_participants: t.max_participants ?? null,
      registration_deadline: t.registration_start || "",
    });
    setEditMode(true);
    setEditError("");
  }
};

const handleEditSave = async () => {
  if (!editData || !t) return;
  setEditError("");
  setEditSaving(true);
  try {
    await adminApi.updateBlitz(id, {
      entry_fee: editData.entry_fee,
      question_count: editData.question_count,
      max_participants: editData.max_participants ?? undefined,
      registration_start: editData.registration_deadline,
    });
    await load();
    setEditMode(false);
    setEditData(null);
    setActionMsg("Settings updated!");
  } catch (e) {
    setEditError(e instanceof ApiError ? e.message : "Failed to save");
  } finally {
    setEditSaving(false);
  }
};

const handleEditCancel = () => {
  setEditMode(false);
  setEditData(null);
  setEditError("");
};
```

---

### UI — Tournament Details Section

Full replacement for the old "Section 1: Config summary" comment block:

```typescript
{/* ── Section 1: Config summary (with edit capability) ── */}
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 space-y-4"
>
  <div className="flex items-center justify-between">
    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Tournament Details</p>
    {!editMode && t.total_registered === 0 && t.status === "draft" && (
      <button onClick={handleEditClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        style={{ backgroundColor: "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}>
        <Pencil size={11} /> Edit
      </button>
    )}
    {!editMode && t.total_registered > 0 && (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ backgroundColor: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af" }}>
        <Lock size={11} /> Locked — {t.total_registered} player{t.total_registered !== 1 ? "s" : ""} registered
      </div>
    )}
  </div>

  {editMode && editData ? (
    // ── Edit form ──
    <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Entry Fee (₦)</label>
          <input
            type="number"
            min="0"
            value={editData.entry_fee}
            onChange={(e) => setEditData({ ...editData, entry_fee: Number(e.target.value) })}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
            style={{
              backgroundColor: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Question Count</label>
          <input
            type="number"
            min="1"
            value={editData.question_count}
            onChange={(e) => setEditData({ ...editData, question_count: Number(e.target.value) })}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
            style={{
              backgroundColor: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Max Players</label>
          <input
            type="number"
            min="1"
            value={editData.max_participants ?? ""}
            onChange={(e) => setEditData({ ...editData, max_participants: e.target.value ? Number(e.target.value) : null })}
            placeholder="Unlimited"
            className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
            style={{
              backgroundColor: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Registration Deadline</label>
          <input
            type="datetime-local"
            value={editData.registration_deadline ? new Date(editData.registration_deadline).toISOString().slice(0, 16) : ""}
            onChange={(e) => setEditData({ ...editData, registration_deadline: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
            style={{
              backgroundColor: "var(--bg-base)",
              borderColor: "var(--border-subtle)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {editError && (
        <div className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg p-2.5 flex items-center gap-2">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {editError}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={handleEditCancel} disabled={editSaving}
          className="px-4 py-2 rounded-lg text-xs font-bold"
          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          Cancel
        </button>
        <button onClick={handleEditSave} disabled={editSaving}
          className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
          {editSaving && <Loader2 size={12} className="animate-spin" />}
          {editSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  ) : (
    // ── Display mode ──
    <>
      {t.description && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.description}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Entry Fee",    value: fmt(t.entry_fee) },
          { label: "Prize Pool",   value: t.prize_pool > 0 ? fmt(t.prize_pool) : maxPool ? `up to ${fmt(maxPool)}` : "₦0" },
          { label: "Questions",    value: `${questions.length} / ${t.question_count}` },
          { label: "Per-Q Time",   value: t.per_question_time_seconds ? `${t.per_question_time_seconds}s` : "—" },
          { label: "Players",      value: t.max_participants ? `${t.total_registered} / ${t.max_participants}` : String(t.total_registered) },
          { label: "Cash Winners", value: String(t.cash_winner_count ?? 1) },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-base)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Prize breakdown */}
      {(t.payout_distribution?.length || positionPrizes.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Prize Breakdown</p>
          {(t.payout_distribution ?? []).map((pct, i) => {
            const rankPool = maxPool ? Math.floor(maxPool * pct / 100) : null;
            const label = i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`;
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Trophy size={12} style={{ color: i === 0 ? "#facc15" : i === 1 ? "#9ca3af" : "#ea580c" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{label} Place ({pct}%)</span>
                </span>
                <span className="font-bold font-mono" style={{ color: "var(--accent-amber)" }}>
                  {rankPool ? `up to ${fmt(rankPool)}` : `${pct}% of pool`}
                </span>
              </div>
            );
          })}
          {positionPrizes.map(p => (
            <div key={p.position} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <Ticket size={12} style={{ color: "var(--accent-violet)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {p.position === 2 ? "2nd" : p.position === 3 ? "3rd" : `${p.position}th`} Place
                </span>
              </span>
              <span className="font-bold text-purple-400">
                {p.prize_type === "free_ticket" ? "🎫 Free entry" : `🏷️ ${p.discount_percent ?? "?"}% off`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Timestamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--border-hairline)" }}>
        {[
          { label: "Registration Opens", value: t.registration_start },
          { label: "Tournament Starts",  value: t.tournament_start },
          { label: "Tournament Ends",    value: t.tournament_end },
        ].map(s => (
          <div key={s.label}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.value ? fmtDate(s.value) : "—"}</p>
          </div>
        ))}
      </div>
    </>
  )}
</motion.div>
```

---

### Imports Update

Add `Lock` to the destructure:
```diff
import {
  ArrowLeft, Zap, Trophy, Ticket, Plus,
- Trash2, CheckCircle, Loader2, AlertTriangle, Pencil, Image, X,
+ Trash2, CheckCircle, Loader2, AlertTriangle, Pencil, Image, X, Lock,
} from "lucide-react";
```

---

### List Page Enhancement (Bonus)

In `/app/admin/blitz/page.tsx`, replace the tournament card div:

```diff
- className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 cursor-pointer"
+ onClick={() => router.push(`/admin/blitz/${t.id}`)}
+ className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:border-[#4C6FFF]/30 transition-colors"
```

And add `onClick={e => e.stopPropagation()}` to the action buttons container:
```diff
- <div className="flex items-center gap-2 flex-shrink-0">
+ <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
```

---

## Component Diagram

```
AdminBlitzDetailPage
│
├─ state
│  ├─ tournament (Detail)
│  ├─ questions (BlitzQuestion[])
│  ├─ editMode (boolean)
│  ├─ editData ({ entry_fee, question_count, max_participants, registration_deadline })
│  ├─ editError (string)
│  └─ editSaving (boolean)
│
├─ handlers
│  ├─ load() — fetches tournament + questions
│  ├─ handleEditClick() — opens edit form with current values
│  ├─ handleEditSave() — calls API, reloads, closes form
│  └─ handleEditCancel() — closes form without saving
│
└─ sections
   ├─ Header (back button, title, status badge)
   ├─ Error/Success alerts
   ├─ Tournament Details (with edit form)
   ├─ Questions section
   └─ Action buttons
```

---

## Testing Commands

```bash
# Run the dev server
npm run dev

# Navigate to:
http://localhost:3000/admin/blitz

# Click a tournament card to open detail view
# If 0 players: click [Edit] and modify fields
# If >0 players: verify [Locked] badge appears
```

---

## Validation Rules

```typescript
// Entry Fee
- Minimum: 0
- Type: number
- Required: yes

// Question Count
- Minimum: 1
- Type: number
- Required: yes

// Max Players
- Minimum: 1 (or leave empty for unlimited)
- Type: number | null
- Required: no

// Registration Deadline
- Type: ISO 8601 datetime string
- Required: yes
- Format: datetime-local picker handles conversion
```

---

## API Contract

### Request
```
PUT /api/admin/blitz/{id}
{
  "entry_fee": 1000,
  "question_count": 10,
  "max_participants": 50,
  "registration_start": "2026-08-31T10:00:00Z"
}
```

### Success Response (200)
```json
{
  "tournament": {
    "id": "...",
    "entry_fee": 1000,
    "question_count": 10,
    "max_participants": 50,
    ...
  }
}
```

### Error Response (400/500)
```json
{
  "error": "Invalid entry fee value"
}
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Edit button not visible | `total_registered > 0` or `status !== "draft"` | Use a draft tournament with 0 players |
| Edit form doesn't save | API endpoint missing | Verify `PUT /api/admin/blitz/{id}` exists |
| Fields not pre-filled | `editData` not initialized | Check `handleEditClick()` logic |
| Lock badge shows wrong count | Using `total_registered` instead of actual count | Verify `total_registered` field is correct |
| datetime-local value not showing | ISO 8601 conversion issue | Check timezone handling in `.slice(0, 16)` |

