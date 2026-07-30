# Backend Debug: Active Specials Not Showing on Player Page

## Symptoms
- Admin dashboard: "3 active" Specials packs (Pill Packs section)
- Player page (`/pills`): "No packs live" — Specials teaser shows "Check back soon"
- Standard Pills section also empty ("No packs live" message)

## Root Cause Theory
The player-facing endpoints (`GET /api/pills/packs` and `GET /api/pills/specials`) apply
additional filters beyond just `status = "active"`. The admin endpoint shows raw status,
but the player endpoint may filter out packs because of:

1. **`quiz_expires_at` has passed** — packs are active but their entry window has closed
2. **`entry_window_end` has passed** — same
3. **Packs have no available pills/questions** — backend guards against empty packs
4. **Entry cap reached** (`max_entries` hit) — backend excludes full packs

## What to Check

### 1. Inspect the 3 active Specials packs in the DB
```sql
SELECT id, name, status, quiz_expires_at, entry_window_end, max_entries, entries_made
FROM pill_packs
WHERE status = 'active' AND (is_vip = true OR pack_type = 'special');
```

Check: Is `quiz_expires_at` or `entry_window_end` in the past?

### 2. Check what the player endpoint actually returns
```bash
curl -H "Authorization: Bearer <player_token>" \
  https://bitlyfe-production.up.railway.app/api/pills/specials
```

If it returns `{ packs: [] }` — the backend is filtering them out.
If it returns the packs but with expired timestamps — the frontend is hiding them.

### 3. Check standard packs too
```bash
curl -H "Authorization: Bearer <player_token>" \
  https://bitlyfe-production.up.railway.app/api/pills/packs
```

## Fix Options

### Option A: Packs have expired entry windows
If `quiz_expires_at` or `entry_window_end` is in the past:
- Either extend/clear those timestamps on the existing packs (via admin update)
- Or remove the expiry filter from the player endpoint if expiry isn't being used

### Option B: Packs have no questions
If the packs have 0 questions in their bank:
- Add questions via Admin > Specials Pack > Manage Question Bank
- The backend may require a minimum question count before surfacing a pack to players

### Option C: Backend filtering logic
If the player endpoint has hard guards, check the route handler for:
```javascript
// Any of these would hide packs from players:
.filter(p => p.quiz_expires_at === null || new Date(p.quiz_expires_at) > new Date())
.filter(p => p.pills.some(pill => pill.status === 'available'))
.filter(p => p.available_question_count > 0)
```

## Frontend Behavior (for reference)
The frontend only receives what the backend sends. It does NOT hide active packs.
The only client-side filter is `status === "active"` on the received list.

The `SpecialsTeaserBanner` additionally filters by `quiz_expires_at` client-side,
but only for the "X live now" count — the teaser still appears even if all are "expired"
client-side (it shows "Check back soon" in that case).

The "No packs live" message for standard pills means `GET /api/pills/packs` returned
zero packs with `status === "active"`.

## Summary
This is a **backend visibility issue**, not a frontend bug.
The packs exist and are marked active, but the player endpoint is not returning them.
Check the DB timestamps and the player endpoint's filter logic.
