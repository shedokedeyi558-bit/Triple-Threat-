# Blitz Detail View — UI State Diagram

## State Machine

```
START
  │
  └─→ [Load Tournament Data]
       │
       ├─→ IS ERROR?
       │   └─→ YES → [Show Error Banner]
       │
       └─→ NO
           │
           └─→ [Tournament Loaded]
               │
               ├─→ [Check: total_registered]
               │
               ├─→ 0 REGISTERED
               │   │
               │   ├─→ [Show: Tournament Details Card]
               │   ├─→ [Header: "Edit" button visible]
               │   │
               │   └─→ [User clicks "Edit"]
               │       │
               │       └─→ ENTER EDIT MODE
               │           ├─→ [setEditMode = true]
               │           ├─→ [setEditData = current values]
               │           │
               │           └─→ [Show: Edit Form]
               │               ├─→ Field: Entry Fee (editable)
               │               ├─→ Field: Question Count (editable)
               │               ├─→ Field: Max Players (editable)
               │               ├─→ Field: Registration Deadline (editable)
               │               ├─→ [Cancel] [Save] buttons
               │               │
               │               ├─→ USER CLICKS "CANCEL"
               │               │   └─→ EXIT EDIT MODE
               │               │       ├─→ [setEditMode = false]
               │               │       ├─→ [setEditData = null]
               │               │       └─→ BACK TO DISPLAY MODE
               │               │
               │               └─→ USER CLICKS "SAVE"
               │                   ├─→ [setEditSaving = true]
               │                   ├─→ [Call API: updateBlitz()]
               │                   │
               │                   ├─→ API SUCCESS?
               │                   │   ├─→ YES
               │                   │   │   ├─→ [setActionMsg = "Settings updated!"]
               │                   │   │   ├─→ [Reload: load()]
               │                   │   │   ├─→ [Exit edit mode]
               │                   │   │   ├─→ [Show success toast]
               │                   │   │   └─→ BACK TO DISPLAY MODE
               │                   │   │
               │                   │   └─→ NO
               │                   │       ├─→ [setEditError = error msg]
               │                   │       ├─→ [Form stays open]
               │                   │       └─→ STAY IN EDIT MODE
               │                   │
               │                   └─→ [setEditSaving = false]
               │
               └─→ >0 REGISTERED
                   │
                   ├─→ [Show: Tournament Details Card]
                   ├─→ [Header: "Locked" badge visible]
                   │   └─→ Badge text: "Locked — N player(s) registered"
                   │
                   └─→ [NO Edit Button]
                   └─→ [NO Edit Form]
                   └─→ [All fields: READ-ONLY text display]
```

---

## Visual Layout — State 1: Display Mode (0 Players)

```
┌─────────────────────────────────────────────────────────────┐
│ < Back  ⚡ Tournament Name                          [Draft] │  ← Header
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Tournament Details                                [✏️ Edit] │  ← Edit button
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Optional description text here...                           │
│                                                               │
│ ┌─────────┬─────────┬─────────┐                            │
│ │Entry Fee│PrizePool│Questions│                            │
│ │  ₦500   │up to ₦5K│   0/10  │                            │
│ └─────────┴─────────┴─────────┘                            │
│ ┌─────────┬─────────┬─────────┐                            │
│ │Per-Q Tim│ Players │Cash Win │                            │
│ │   10s   │  0/100  │    1    │                            │
│ └─────────┴─────────┴─────────┘                            │
│                                                               │
│ Prize Breakdown                                             │
│   🏆 1st Place (50%)  →  up to ₦2,500                      │
│   🏆 2nd Place (30%)  →  up to ₦1,500                      │
│   🏆 3rd Place (20%)  →  up to ₦1,000                      │
│                                                               │
│ Registration Opens   Tournament Starts   Tournament Ends    │
│ Aug 31, 10:00 AM     Sep 1, 6:00 PM     Sep 1, 7:00 PM    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

[Questions Section Below]
[Action Buttons Below]
```

---

## Visual Layout — State 2: Edit Mode (0 Players, After Clicking Edit)

```
┌─────────────────────────────────────────────────────────────┐
│ < Back  ⚡ Tournament Name                          [Draft] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Tournament Details                                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────┬─────────────────────┐              │
│ │Entry Fee (₦)        │Question Count       │              │
│ │[500_____________]   │[10______________]   │              │
│ └─────────────────────┴─────────────────────┘              │
│ ┌─────────────────────┬─────────────────────┐              │
│ │Max Players          │Registration Deadline│              │
│ │[100_____________]   │[2026-08-31 10:00 AM│              │
│ └─────────────────────┴─────────────────────┘              │
│                                                               │
│ ⚠️  ✕ Optional error message here in red                   │
│                                                               │
│                             [Cancel]  [💾 Save]            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Visual Layout — State 3: Display Mode (>0 Players)

```
┌─────────────────────────────────────────────────────────────┐
│ < Back  ⚡ Tournament Name                       [Active]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Tournament Details                🔒 Locked — 15 players     │  ← Lock badge
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Optional description text here...                           │
│                                                               │
│ ┌─────────┬─────────┬─────────┐                            │
│ │Entry Fee│PrizePool│Questions│                            │
│ │  ₦500   │ ₦7,500  │  10/10  │                            │
│ └─────────┴─────────┴─────────┘                            │
│ ┌─────────┬─────────┬─────────┐                            │
│ │Per-Q Tim│ Players │Cash Win │                            │
│ │   10s   │ 15/100  │    1    │                            │
│ └─────────┴─────────┴─────────┘                            │
│                                                               │
│ Prize Breakdown                                             │
│   🏆 1st Place (50%)  →  ₦3,750                            │
│   🏆 2nd Place (30%)  →  ₦2,250                            │
│   🏆 3rd Place (20%)  →  ₦1,500                            │
│                                                               │
│ Registration Opens   Tournament Starts   Tournament Ends    │
│ Aug 31, 10:00 AM     Sep 1, 6:00 PM     Sep 1, 7:00 PM    │
│                                                               │
└─────────────────────────────────────────────────────────────┘

[No Edit Controls Visible Anywhere]
[Questions Section Below]
[Action Buttons Below]
```

---

## Component Structure

```
<AdminBlitzDetailPage>
  │
  ├─ [Header]
  │  ├─ Back button
  │  ├─ Title + Icon
  │  └─ Status badge
  │
  ├─ [Error Alert] (if error state)
  │
  ├─ [Success Toast] (if action message)
  │
  ├─ [Tournament Details Card] ← MAIN FOCUS
  │  │
  │  ├─ [Card Header]
  │  │  ├─ "Tournament Details" label
  │  │  │
  │  │  ├─ IF: !editMode && total_registered === 0 && status === "draft"
  │  │  │   └─ [Edit Button] ←─ SHOWS EDIT BUTTON
  │  │  │
  │  │  ├─ IF: !editMode && total_registered > 0
  │  │  │   └─ [Lock Badge] ←─ SHOWS LOCK BADGE
  │  │  │
  │  │  └─ IF: editMode
  │  │      └─ (Neither button nor badge visible)
  │  │
  │  ├─ [Card Content]
  │  │  │
  │  │  ├─ IF: editMode && editData
  │  │  │   └─ [Edit Form]
  │  │  │      ├─ [Entry Fee Input]
  │  │  │      ├─ [Question Count Input]
  │  │  │      ├─ [Max Players Input]
  │  │  │      ├─ [Registration Deadline Input]
  │  │  │      ├─ [Error Alert] (if editError)
  │  │  │      └─ [Buttons: Cancel, Save]
  │  │  │
  │  │  └─ ELSE (Display Mode)
  │  │      ├─ [Description] (if present)
  │  │      ├─ [Summary Grid]
  │  │      │  ├─ Entry Fee (read-only)
  │  │      │  ├─ Prize Pool (read-only)
  │  │      │  ├─ Questions (read-only)
  │  │      │  ├─ Per-Q Time (read-only)
  │  │      │  ├─ Players (read-only)
  │  │      │  └─ Cash Winners (read-only)
  │  │      ├─ [Prize Breakdown] (if applicable)
  │  │      └─ [Timestamps]
  │
  ├─ [Questions Section]
  │  ├─ [Questions list or empty state]
  │  └─ [Add Question button]
  │
  └─ [Action Buttons Section]
     ├─ [Publish] (if draft)
     ├─ [Activate] (if registration)
     ├─ [Score & Pay] (if active)
     └─ [View Leaderboard] (if completed)
```

---

## Data Flow: Edit Scenario

```
User views Tournament (0 players)
    ↓
[Display Mode shown]
    ↓
User clicks [Edit] button
    ↓
handleEditClick() triggered
    ├─ Check: t.total_registered === 0? ✓
    ├─ Initialize editData object
    │  ├─ entry_fee: 500
    │  ├─ question_count: 10
    │  ├─ max_participants: 100
    │  └─ registration_deadline: "2026-08-31T10:00:00Z"
    ├─ setEditMode(true)
    └─ setEditError("")
    ↓
React re-renders
    ├─ editMode = true, editData = {...}
    └─ [Edit Form shown]
    ↓
User modifies entry_fee to 2000
    ↓
onChange handler triggered
    └─ setEditData({ ...editData, entry_fee: 2000 })
    ↓
User clicks [Save]
    ↓
handleEditSave() triggered
    ├─ setEditSaving(true)
    ├─ API call: adminApi.updateBlitz(id, {
    │  ├─ entry_fee: 2000
    │  ├─ question_count: 10
    │  ├─ max_participants: 100
    │  └─ registration_start: "2026-08-31T10:00:00Z"
    │})
    │
    ├─ IF API SUCCESS
    │  ├─ load() → refetch tournament data
    │  ├─ setEditMode(false)
    │  ├─ setEditData(null)
    │  ├─ setActionMsg("Settings updated!")
    │  └─ Show success toast (auto-hide after 2s)
    │
    └─ IF API ERROR
       ├─ setEditError(error.message)
       └─ Form stays open
    ↓
React re-renders
    ├─ IF success
    │  ├─ editMode = false, editData = null
    │  └─ [Display Mode shown with new values]
    │
    └─ IF error
       ├─ editMode = true (form stays open)
       ├─ Error message displayed in red
       └─ User can correct and retry or click Cancel
```

---

## Conditional Rendering Logic

```javascript
// Show Edit Button?
{!editMode && t.total_registered === 0 && t.status === "draft" && (
  <button>...</button>
)}

// Show Lock Badge?
{!editMode && t.total_registered > 0 && (
  <div>Locked — N players registered</div>
)}

// Show Edit Form?
{editMode && editData && (
  <div>/* 4 input fields + error + buttons */</div>
)}

// Show Display Mode?
{!editMode || !editData ? (
  <div>/* summary grid + prize breakdown + timestamps */</div>
)}
```

---

## CSS Classes Used

### Colors
- **Indigo**: `bg-blue-500/20`, `text-blue-400`, `border-blue-500/30` (edit button)
- **Grey**: `bg-gray-700/20`, `text-gray-400` (draft status)
- **Grey-muted**: `rgba(107,114,128,0.15)`, `#9ca3af` (lock badge)
- **Red-error**: `bg-red-900/10`, `text-red-400`, `border-red-900/30`
- **Dark-bg**: `bg-[#141414]`, `bg-[#1A1A1A]`
- **Borders**: `border-[#1E1E1E]`, `border-[#333]`

### Responsive
- Mobile: 1-column forms
- Desktop: 2-column forms (`grid-cols-1 sm:grid-cols-2`)

### Text
- Label: `text-[10px] uppercase font-bold`
- Value: `text-sm font-bold`
- Input: `text-sm font-semibold`

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate through form fields |
| `Enter` | Submit form (Save) |
| `Escape` | Close form (Cancel) — *not implemented, uses Cancel button* |

---

## Accessibility Notes

✅ Labels properly associated with inputs using `<label>` elements
✅ Error messages use `AlertTriangle` icon + text for dual indication
✅ Button states clearly indicated (disabled = opacity-50)
✅ Form inputs have proper `type` attributes (number, datetime-local)
✅ Color not used as only indicator (icon + text redundancy)
✅ Minimum touch target size: 40px (buttons are larger)

