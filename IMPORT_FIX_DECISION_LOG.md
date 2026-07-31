# Import from Library — Decision Log & Status

## Executive Summary

**Question:** Does the endpoint `POST /api/admin/specials-bank/library/copy-to-pack` exist and work?

**Investigation Result:** ⚠️ **UNKNOWN** — Not found in frontend codebase, but could exist only on backend (external Rails app).

**Decision:** Point frontend at this endpoint on the assumption it exists. If it doesn't, backend team will confirm and we'll pivot to an alternative pattern.

**Frontend Change:** Already applied (see below).

---

## What Was Found

### ✅ Confirmed Exists:
- `/api/admin/specials-bank/library` (GET, POST, PATCH, DELETE for draft questions)
- `/api/admin/specials-bank/packs/{packId}/bulk-add` (POST — add questions directly)
- `/api/admin/specials-bank/packs/{targetId}/clone-from/{sourceId}` (POST — clone entire bank)

### ❌ Not Found Anywhere:
- `/api/admin/specials-bank/library/copy-to-pack` (referenced as existing but no evidence)

### ⚠️ Broken:
- `/api/admin/specials-bank/library/importFromLibrary` (returns 400 "No questions provided")
  - Was supposed to be fixed in commit 6c0e54b but still broken
  - This is the OLD endpoint the user says should be replaced

---

## Frontend Change Applied

**File:** `lib/api.ts` (line 1315–1318)

**New implementation:**
```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/library/copy-to-pack`,
    { method: "POST", body: { question_ids: questionIds, pack_id: packId }, token: getAdminToken() }
  ),
```

**Why this choice?**
- User mentioned this endpoint exists and works
- No evidence in frontend codebase to contradict it
- It's a reasonable endpoint pattern for this operation
- Following principle: use existing backend endpoint if available before creating new ones

**Request shape:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", "uuid-3", ...],
  "pack_id": "target-pack-uuid"
}
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "inserted": 52
  }
}
```

---

## Testing Required

**To validate this fix works end-to-end:**

1. **Open admin > Specials Packs**
2. **Select a pack** (e.g., "Roxy" or any pack with 0 questions in its bank)
3. **Click "Manage Question Bank"**
4. **Click "Import from Library"**
5. **Select some questions** (click checkboxes, select all or just a few)
6. **Click "Import N questions"**
7. **Expected outcome:**
   - Success message showing count of imported questions
   - Questions now appear in the pack's question bank list
   - Bank health indicator updates

**Current status:** ⏳ Awaiting backend team confirmation

---

## Fallback Plan (If `copy-to-pack` Doesn't Exist)

If backend confirms the `copy-to-pack` endpoint doesn't exist, switch to **Pattern A**:

```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/packs/${packId}/import-from-library`,
    { method: "POST", body: { question_ids: questionIds }, token: getAdminToken() }
  ),
```

This follows the established URL pattern:
- `POST /api/admin/specials-bank/packs/{packId}/bulk-add` (direct add)
- `POST /api/admin/specials-bank/packs/{packId}/clone-from/{sourceId}` (clone)
- `POST /api/admin/specials-bank/packs/{packId}/import-from-library` (import from library) ← NEW

This is the most consistent pattern and is recommended as the true solution if the user was mistaken about `copy-to-pack`.

---

## Files Updated/Created

### Updated:
- `lib/api.ts` — Changed endpoint to `copy-to-pack`

### Created (for reference/documentation):
- `ENDPOINT_INVESTIGATION_REPORT.md` — Full investigation results
- `IMPORT_FIX_DECISION_LOG.md` — This file
- `BACKEND_SPECIALS_IMPORT_IMPLEMENTATION.md` — Backend spec (old endpoint, can be repurposed)
- `BACKEND_SPECIALS_IMPORT_DEBUG.md` — Debug guide

### Previous (to be deleted/archived):
- `FRONTEND_SPECIALS_IMPORT_FIX.md` — Outdated (pointed to wrong endpoint)
- `IMPORT_FIX_SUMMARY.txt` — Outdated (pointed to wrong endpoint)

---

## Next Steps

1. **Backend Team Action:** Confirm whether `/api/admin/specials-bank/library/copy-to-pack` endpoint exists
2. **If Yes:** Test the endpoint works with the request payload shown above
3. **If No:** Implement one of the documented alternatives
4. **Frontend Team Action:** Run end-to-end test once backend confirms

---

## Status Summary

| Item | Status |
|------|--------|
| Frontend code updated | ✅ Yes |
| Syntax/build validation | ⏳ Pending (no errors expected) |
| Endpoint verified to exist | ❓ Pending backend confirmation |
| End-to-end test passed | ❓ Pending backend confirmation |
| Documentation complete | ✅ Yes |

---

## Decision Rationale

**Why assume `copy-to-pack` exists rather than create new endpoint?**

1. User explicitly mentioned it was already built
2. No contradicting evidence found in frontend codebase
3. Reusing existing endpoints is preferred over creating new ones
4. If wrong, backend team can easily correct and implement the actual endpoint
5. Frontend code is already set up correctly for the operation
6. This is the fastest path to get the feature working

**If proven wrong, it's a 1-line fix to point to the correct endpoint.**
