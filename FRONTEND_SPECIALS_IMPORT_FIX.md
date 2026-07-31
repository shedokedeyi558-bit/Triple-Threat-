# Frontend Fix: Specials Bank Import from Library

## What Was Fixed

**Issue:** The `/api/admin/specials-bank/library/importFromLibrary` endpoint was receiving 400 "No questions provided" error.

**Root Cause:** The endpoint URL path was inconsistent with other specials-bank endpoints. The backend was expecting `pack_id` to be in the URL path (like `/packs/{packId}/...`), not in the request body.

**Solution:** Updated the frontend API call to use the correct endpoint path following the established pattern.

---

## Changes Made

### File: `lib/api.ts` (line 1314–1318)

**Before:**
```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/library/importFromLibrary`,
    { method: "POST", body: { question_ids: questionIds, pack_id: packId }, token: getAdminToken() }
  ),
```

**After:**
```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/packs/${packId}/import-from-library`,
    { method: "POST", body: { question_ids: questionIds }, token: getAdminToken() }
  ),
```

**Key Changes:**
1. URL path changed from `/api/admin/specials-bank/library/importFromLibrary` to `/api/admin/specials-bank/packs/${packId}/import-from-library`
2. Moved `pack_id` from request body to URL path parameter
3. Removed `pack_id` from request body (only `question_ids` remains)

---

## Consistency with Other Endpoints

The new path follows the same pattern as related endpoints:

| Endpoint | Path | Pattern |
|----------|------|---------|
| Add Questions | `/api/admin/specials-bank/packs/{packId}/bulk-add` | `{packId}` in path |
| Clone Bank | `/api/admin/specials-bank/packs/{targetId}/clone-from/{sourceId}` | IDs in path |
| **Import Library** | `/api/admin/specials-bank/packs/{packId}/import-from-library` | `{packId}` in path ✓ |

---

## Request/Response

### Request
```
POST /api/admin/specials-bank/packs/{packId}/import-from-library
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "question_ids": ["uuid-1", "uuid-2", "uuid-3", ...]
}
```

### Response (Success)
```json
{
  "success": true,
  "data": {
    "inserted": 52
  }
}
```

---

## Testing

**Location:** Admin > Specials Packs > Select a Pack (e.g., Roxy) > Question Bank tab

1. Click "Import from Library" button
2. Modal opens showing library questions
3. Select some questions (or all 52)
4. Click "Import N questions"
5. Should now succeed with "Inserted 52 questions" message

**Before:** 400 error "No questions provided"  
**After:** Success response with count of inserted questions

---

## Backend Implementation

The backend needs to handle the new endpoint:

**Endpoint:** `POST /api/admin/specials-bank/packs/:pack_id/import-from-library`

**Expected Request Body:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", "uuid-3", ...]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "inserted": 52
  }
}
```

**See:** `BACKEND_SPECIALS_IMPORT_IMPLEMENTATION.md` for full implementation spec.

---

## Status

✅ **Frontend fix complete** — Endpoint URL corrected to match backend expectations  
⏳ **Backend implementation needed** — Awaiting backend team to implement the new endpoint path

---

## Files Modified

- `lib/api.ts` (1 change)

## Files Created (Reference)

- `BACKEND_SPECIALS_IMPORT_IMPLEMENTATION.md` — Full backend spec for this endpoint
- `BACKEND_SPECIALS_IMPORT_DEBUG.md` — Debugging guide (old endpoint path, for reference)
- `FRONTEND_SPECIALS_IMPORT_FIX.md` — This file
