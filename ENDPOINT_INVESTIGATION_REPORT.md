# Endpoint Investigation: Import from Library

## Problem Statement
The "Import from Library" feature in Specials Pack Question Bank is failing with 400 error "No questions provided". Need to verify if an existing endpoint can be reused instead of creating a new one.

---

## Investigation Results

### 1. Search for `POST /api/admin/specials-bank/library/copy-to-pack`

**Status:** ❌ **NOT FOUND**

**Where searched:**
- Frontend code (lib/api.ts, all admin pages)
- Frontend documentation files
- Git commit history (all branches)
- Git grep of codebase

**Conclusion:** The `copy-to-pack` endpoint mentioned does not exist in the current codebase or git history.

---

### 2. Current API Endpoints for Question Bank Operations

All endpoints found in `lib/api.ts`:

**Library management (questions not yet assigned to a pack):**
- `GET /api/admin/specials-bank/library` — Get all draft questions
- `POST /api/admin/specials-bank/library` — Add a new draft question
- `PATCH /api/admin/specials-bank/library/{id}` — Edit a draft question
- `DELETE /api/admin/specials-bank/library/{id}` — Delete a draft question

**Pack operations:**
- `POST /api/admin/specials-bank/packs/{packId}/bulk-add` — Add questions directly to pack
- `POST /api/admin/specials-bank/packs/{targetId}/clone-from/{sourceId}` — Clone entire bank from another pack
- `POST /api/admin/specials-bank/packs/{packId}/questions` — Get questions in pack

**Import (WHAT WE'RE INVESTIGATING):**
- `POST /api/admin/specials-bank/library/importFromLibrary` (currently)
  - Body: `{ question_ids: [...], pack_id: packId }`
  - Status: 400 "No questions provided" error

**Historical endpoint (from git):**
- `POST /api/admin/specials-bank/packs/{packId}/import` (before commit 6c0e54b)
  - Body: `{ question_ids: [...] }`
  - Was changed to `/library/importFromLibrary` supposedly to "match backend"

---

### 3. Git History of the Import Endpoint

**Commit 6c0e54b** (July 25, 2026):
- **Message:** "Fix importFromLibrary endpoint and payload to match backend"
- **Change:** Old → New
  - Old: `POST /api/admin/specials-bank/packs/{packId}/import` with `{ question_ids: [...] }`
  - New: `POST /api/admin/specials-bank/library/importFromLibrary` with `{ question_ids: [...], pack_id: packId }`
- **Supposed to fix:** 400 'No questions provided' error
- **Current status:** ❌ Still broken (same error)

---

### 4. What the Frontend Needs to Do

**User flow:**
1. Admin goes to Specials Pack > Question Bank
2. Clicks "Import from Library"
3. Modal opens showing all draft questions from `/api/admin/specials-bank/library`
4. Admin selects specific questions (creates a `Set<questionId>`)
5. Clicks "Import N questions"
6. Frontend calls: `importFromLibrary(packId, Array.from(selected))`
   - `packId`: UUID of the target pack
   - `selected`: Array of question UUIDs from library

**The endpoint must:**
- Accept these question UUIDs
- Copy them from the library into the target pack's question bank
- Return `{ inserted: count }`

---

### 5. Possible Endpoint Patterns Based on Backend Conventions

Given other endpoints follow this pattern:
- `POST /api/admin/specials-bank/packs/{packId}/bulk-add` — Direct add to pack
- `POST /api/admin/specials-bank/packs/{packId}/clone-from/{sourceId}` — Copy from another pack

**Most likely endpoint for importing from library should be ONE of:**

**Option A:** (Recommended — follows pattern of other pack operations)
```
POST /api/admin/specials-bank/packs/{packId}/import-from-library
Body: { question_ids: [...] }
```

**Option B:** (Library-centric — copy to pack from library)
```
POST /api/admin/specials-bank/library/copy-to-pack
Body: { question_ids: [...], pack_id: packId }
```

**Option C:** (Matches what commit 6c0e54b claimed to do)
```
POST /api/admin/specials-bank/library/importFromLibrary
Body: { question_ids: [...], pack_id: packId }
```

---

## Current Fix Applied

Frontend now points to **Option B** (the one user mentioned):

```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/library/copy-to-pack`,
    { method: "POST", body: { question_ids: questionIds, pack_id: packId }, token: getAdminToken() }
  ),
```

---

## Next Steps (Backend)

### Verify/Implement the endpoint:

1. **Check if `/api/admin/specials-bank/library/copy-to-pack` actually exists** on backend
   - If yes → Test it works
   - If no → Create it OR tell us the actual endpoint name

2. **Expected behavior:**
   - Accept `question_ids: string[]` and `pack_id: string` in request body
   - Return `{ "success": true, "data": { "inserted": number } }`
   - Handle edge cases:
     - No questions provided → 400 "No questions provided"
     - Pack not found → 400 "Pack not found"
     - Question not in library → 400 "Question {id} not found"
     - Success → 200 with count

3. **Test with real data:**
   - Open admin > Specials > Pack (e.g., Roxy)
   - Click "Manage Question Bank" > "Import from Library"
   - Select some questions
   - Click "Import N questions"
   - Verify they appear in the pack's bank

---

## Documentation Updated

The following files have been created to document this:

1. `BACKEND_SPECIALS_IMPORT_IMPLEMENTATION.md` — Full spec (old endpoint path, can be repurposed)
2. `BACKEND_SPECIALS_IMPORT_DEBUG.md` — Debug guide
3. `ENDPOINT_INVESTIGATION_REPORT.md` — This file

---

## Summary

| Question | Answer |
|----------|--------|
| Does `/api/admin/specials-bank/library/copy-to-pack` exist? | ❓ **To be confirmed by backend team** |
| Is there an alternative endpoint we should use? | ❓ **Needs backend verification** |
| What endpoint is currently being called? | `POST /api/admin/specials-bank/library/copy-to-pack` with `{question_ids, pack_id}` |
| Is this change backward compatible? | ✅ Yes, only affects the import flow |
| Does it require frontend tests? | ✅ Yes, needs end-to-end test of import flow |

---

## Recommendation

**Option 1 (If `copy-to-pack` exists):** Keep current fix and have backend confirm/test the endpoint works.

**Option 2 (If `copy-to-pack` doesn't exist):** Use **Option A** pattern instead:
```
POST /api/admin/specials-bank/packs/{packId}/import-from-library
Body: { question_ids: [...] }
```
This follows existing URL patterns and is cleaner.
