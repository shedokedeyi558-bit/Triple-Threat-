# Backend Implementation: Specials Bank Import from Library

## Endpoint Specification

**Route:** `POST /api/admin/specials-bank/packs/:pack_id/import-from-library`

**Authentication:** Admin token required (Bearer token in Authorization header)

---

## Request

### URL Path Parameter
```
:pack_id (UUID) — The target pack to import questions into
```

### Request Body (JSON)
```json
{
  "question_ids": ["uuid-1", "uuid-2", "uuid-3", ...]
}
```

**Fields:**
- `question_ids` (array of strings, required) — UUIDs of library questions to import into this pack

### Example Request
```bash
POST /api/admin/specials-bank/packs/550e8400-e29b-41d4-a716-446655440099/import-from-library
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "question_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

## Response

### Success Response (HTTP 200)
```json
{
  "success": true,
  "data": {
    "inserted": 2
  }
}
```

**Fields:**
- `inserted` (integer) — Number of questions successfully imported

### Error Responses

**400 Bad Request — No questions provided**
```json
{
  "success": false,
  "error": "No questions provided"
}
```
Returned when `question_ids` array is empty or missing.

**400 Bad Request — Invalid pack_id**
```json
{
  "success": false,
  "error": "Pack not found"
}
```
Returned when the pack UUID doesn't exist or isn't accessible by this admin.

**400 Bad Request — Question not found**
```json
{
  "success": false,
  "error": "Question with ID {uuid} not found in library"
}
```
Returned when one or more question IDs don't exist in the library (or some similar validation error).

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
Returned when no admin token or invalid token.

---

## Implementation Logic

1. **Validate request:**
   - Extract `pack_id` from URL path
   - Extract `question_ids` from request body JSON
   - Return 400 "No questions provided" if array is empty or null

2. **Authorize:**
   - Verify admin token is valid
   - Verify admin owns/can modify this pack (same admin who created it, or has global admin)
   - Return 401 if not authorized

3. **Fetch pack:**
   - Look up pack by `pack_id`
   - Return 400 "Pack not found" if it doesn't exist

4. **Fetch library questions:**
   - For each UUID in `question_ids`, fetch from the questions library table
   - Validate all questions exist
   - Return 400 if any are missing

5. **Insert into pack's question bank:**
   - For each question, create a link/record in the pack's questions table
   - Handle any duplicates gracefully (skip if already in pack, or update, per your logic)
   - Track count of successfully inserted rows

6. **Return response:**
   - HTTP 200 with `{ "inserted": count }`

---

## Notes

- **Idempotency:** If the same question is imported twice, decide the behavior:
  - Option A: Skip duplicates (don't re-insert)
  - Option B: Replace existing entry
  - Option C: Allow duplicates (same question appears twice in the pack)
  
  Current frontend doesn't have dedup, so choose one and document it.

- **Question Bank Limits:** If the pack has a max question count, enforce it. Currently, packs can have up to `pack.total_questions` (e.g., 300 for Roxy). Return 400 if import would exceed the limit.

- **Performance:** If importing large batches (50+ questions), consider using bulk insert/upsert instead of looping.

---

## Related Endpoints (for consistency)

This endpoint follows the same URL pattern as:

1. **Add Questions (Bulk):**
   ```
   POST /api/admin/specials-bank/packs/:pack_id/bulk-add
   Body: { "questions": [...] }
   Response: { "inserted": number, "errors": [...] }
   ```

2. **Clone Bank from Pack:**
   ```
   POST /api/admin/specials-bank/packs/:target_pack_id/clone-from/:source_pack_id
   Response: { "inserted": number }
   ```

All use pack IDs in the URL path and return `{ "inserted": number }` on success.

---

## Frontend Code

**Location:** `lib/api.ts` line 1314–1318

```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/packs/${packId}/import-from-library`,
    { method: "POST", body: { question_ids: questionIds }, token: getAdminToken() }
  ),
```

**Usage:** `app/admin/pills/[packId]/bank/page.tsx` line 480

```typescript
await adminApi.importFromLibrary(packId, Array.from(selected));
```

The user selects question IDs from the library in a modal, clicks "Import N questions", and calls this endpoint.
