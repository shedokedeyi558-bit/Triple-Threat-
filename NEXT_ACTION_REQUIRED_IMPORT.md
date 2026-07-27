# ACTION REQUIRED: Confirm Import Endpoint

## Current Status

The frontend's "Import from Library" feature has been updated to use the endpoint you mentioned exists:

```
POST /api/admin/specials-bank/library/copy-to-pack
```

**Request body:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", ...],
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

## What We Need From Backend Team

1. **Confirm this endpoint exists** at `POST /api/admin/specials-bank/library/copy-to-pack`
2. **Test it works** with the request format above
3. **Report back** with either:
   - ✅ "Endpoint works, import succeeds" → Ready to test
   - ⚠️ "Endpoint exists but payload format is different" → Tell us the correct format
   - ❌ "Endpoint doesn't exist" → We'll create it per the spec below

---

## If Endpoint Doesn't Exist

Use this specification to implement it:

### Endpoint: `POST /api/admin/specials-bank/library/copy-to-pack`

**Authentication:** Admin token required

**Request body:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", ...],
  "pack_id": "uuid"
}
```

**Validation:**
- If `question_ids` is empty or null → return 400 "No questions provided"
- If `pack_id` is not found → return 400 "Pack not found"
- If any question_id is not in library → return 400 "Question {id} not found in library"

**Logic:**
1. For each question_id, copy from questions library into target pack's question bank
2. Handle duplicates as desired (skip, replace, or error)
3. Count successful inserts

**Response (success):**
```json
{
  "success": true,
  "data": {
    "inserted": 52
  }
}
```

**Response (error example):**
```json
{
  "success": false,
  "error": "No questions provided"
}
```

---

## Alternative If copy-to-pack Shouldn't Be Used

If there's a reason not to use `copy-to-pack`, implement this pattern instead:

```
POST /api/admin/specials-bank/packs/{packId}/import-from-library
```

This follows the same URL pattern as:
- `POST /api/admin/specials-bank/packs/{packId}/bulk-add`
- `POST /api/admin/specials-bank/packs/{targetId}/clone-from/{sourceId}`

**Request body:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", ...]
}
```

(No pack_id in body — it's in the URL path)

Then we'll update the frontend to match this new endpoint.

---

## Frontend Testing Steps

Once backend confirms the endpoint works:

1. **Go to:** Admin > Specials Packs
2. **Select:** Any pack (preferably one with 0 questions in its bank)
3. **Click:** "Manage Question Bank"
4. **Click:** "Import from Library"
5. **Select:** All questions (or specific ones)
6. **Click:** "Import [N] questions"
7. **Expected:** Success message + questions appear in bank

---

## Timeline

- ⏳ **Waiting for:** Backend confirmation
- 🟢 **Ready when:** Endpoint is confirmed/implemented
- ✅ **Deployed to:** Frontend already updated, just needs backend endpoint

---

## Files For Reference

- `ENDPOINT_INVESTIGATION_REPORT.md` — Full investigation of what exists/what doesn't
- `IMPORT_FIX_DECISION_LOG.md` — Decision-making process
- `BACKEND_SPECIALS_IMPORT_IMPLEMENTATION.md` — Full backend spec
- `BACKEND_SPECIALS_IMPORT_DEBUG.md` — Debug guide with examples

---

**Please confirm the endpoint status so we can proceed with testing.**
