# Blitz Tournament Detail View — Edit Capability Diff

## Summary
Added editable tournament detail fields to the Blitz detail page (`/admin/blitz/[id]`) with registration-lock gating:
- If `total_registered === 0`: Show an **Edit** button to modify entry fee, question count, max players, and registration deadline
- If `total_registered > 0`: Show a **Locked** badge (no edit controls rendered)
- Prize pool and title remain always read-only

## File Changed
- `app/admin/blitz/[id]/page.tsx`

---

## Key Changes

### 1. Imports (Line 9-11)
```diff
- import {
-   ArrowLeft, Zap, Users, Clock, Trophy, Ticket, Plus,
+ import {
+   ArrowLeft, Zap, Trophy, Ticket, Plus,
-   Trash2, CheckCircle, Loader2, AlertTriangle, Pencil, Image, X,
+   Trash2, CheckCircle, Loader2, AlertTriangle, Pencil, Image, X, Lock,
  } from "lucide-react";
```
**Reason**: Removed unused `Users` and `Clock` icons; added `Lock` icon for the locked state badge.

---

### 2. State Management (Lines 272-278)
Added new edit mode state variables:

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

**Reason**: Manages inline edit form state when user clicks "Edit".

---

### 3. Edit Handlers (Lines 328-376)

#### handleEditClick()
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
```
Populates edit form with current tournament data and opens edit mode.

#### handleEditSave()
```typescript
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
```
Calls `adminApi.updateBlitz()` (which uses the existing PUT endpoint), reloads data, and closes edit mode.

#### handleEditCancel()
```typescript
const handleEditCancel = () => {
  setEditMode(false);
  setEditData(null);
  setEditError("");
};
```
Closes edit mode without saving.

---

### 4. Tournament Details Section (Lines 425-560)

#### Header with Conditional UI
```typescript
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
```

**Logic**:
- **Edit button**: Only shown if `total_registered === 0` AND `status === "draft"` AND NOT already in edit mode
- **Lock badge**: Only shown if `total_registered > 0` AND NOT in edit mode
- Clear, human-readable message: "Locked — N player(s) registered"

#### Edit Form (when editMode && editData)
```typescript
{editMode && editData ? (
  <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Entry Fee input */}
      {/* Question Count input */}
      {/* Max Players input */}
      {/* Registration Deadline datetime picker */}
    </div>
    {/* Error display */}
    {/* Cancel / Save buttons */}
  </div>
) : (
  // ── Display mode ── (existing summary grids + prize breakdown)
)}
```

**Features**:
- 4 editable fields in responsive 2-column grid
- Entry fee: `type="number"` with `min="0"`
- Question count: `type="number"` with `min="1"`
- Max players: `type="number"` with `min="1"`, supports null (unlimited)
- Registration deadline: `type="datetime-local"` with ISO 8601 conversion
- Error display with alert styling
- Cancel & Save buttons with loading state

#### Display Mode
When not editing, shows existing layout:
- Description (if present)
- Summary grid (Entry Fee, Prize Pool, Questions, Per-Q Time, Players, Cash Winners)
- Prize breakdown
- Timestamps

**Key**: Read-only display does NOT change—only entry fee & registration deadline fields are now editable when unlocked.

---

## Behavior Matrix

| Scenario | Edit Button | Lock Badge | Edit Form | Fields Editable |
|----------|-------------|------------|-----------|-----------------|
| `registered=0`, `status=draft` | ✅ Shown | ❌ Hidden | ✅ Shown on click | ✅ Yes |
| `registered=0`, `status≠draft` | ❌ Hidden | ❌ Hidden | ❌ Not available | ❌ No |
| `registered>0` | ❌ Hidden | ✅ Shown | ❌ Not available | ❌ No |
| Edit mode active | ❌ Hidden | ❌ Hidden | ✅ Shown | ✅ Yes |

---

## API Integration

**Endpoint Used**: `PUT /api/admin/blitz/{id}` (existing `adminApi.updateBlitz()`)

**Payload**:
```typescript
{
  entry_fee: number;
  question_count: number;
  max_participants: number | undefined;
  registration_start: string; // ISO 8601 datetime
}
```

**Behavior**:
- Changes are sent to backend immediately on Save
- Full tournament data is reloaded after success
- Error messages from backend are displayed in the form
- Success flash message: "Settings updated!"

---

## Design System Consistency

✅ Matches existing Pill Pack detail page patterns:
- Same dark card styling (`bg-[#141414]`, `border-[#1E1E1E]`)
- Same input field styling (dark backgrounds, indigo borders on focus)
- Same error/success messaging
- Same button styling (indigo primary, neutral secondary)
- Same animation patterns (`motion.div` with `initial/animate` states)
- Typography: 10px uppercase labels, 9-12px secondary text

---

## Test Cases

### Test 1: Unregistered Tournament (0 players)
1. Navigate to Blitz detail page for a draft tournament with `total_registered === 0`
2. ✅ Should see **Edit** button in header
3. Click Edit
4. ✅ Form should appear with 4 input fields pre-populated with current values
5. Modify values (e.g., increase entry fee to 2000)
6. Click Save
7. ✅ "Settings updated!" message should appear
8. ✅ Form should close
9. ✅ Display should show new entry fee value

### Test 2: Registered Tournament (players enrolled)
1. Navigate to Blitz detail page for a tournament with `total_registered > 0`
2. ✅ Should see **Locked** badge with player count
3. ✅ Edit button should NOT be present
4. ✅ All fields should appear read-only (no inputs rendered)

### Test 3: Edit Mode Cancellation
1. From Test 1, click Edit again
2. Modify a value
3. Click Cancel
4. ✅ Form should close without saving
5. ✅ Original value should be displayed

### Test 4: Prize Pool & Title Always Read-Only
1. In any tournament detail view
2. ✅ Prize Pool should never have an input field
3. ✅ Title should never have an input field
4. Both shown only in read-only display sections

---

## Files Modified
- `c:\Users\DELL\Desktop\Anonymous\triple-threat\app\admin\blitz\[id]\page.tsx`

## No Breaking Changes
- Existing question management (add/delete) works as before
- Existing action buttons (Publish, Activate, Score & Pay) unchanged
- Existing leaderboard navigation unchanged
- API endpoint is existing `PUT /api/admin/blitz/{id}` — no new backend required
