# Backend Debug: Specials Bank Import Failing with "No questions provided"

## Frontend Issue Report
The endpoint `POST /api/admin/specials-bank/library/importFromLibrary` is returning:
```json
{
  "success": false,
  "error": "No questions provided"
}
```

Even though the frontend is sending valid data.

---

## Frontend Payload Being Sent

**Endpoint:** `POST /api/admin/specials-bank/packs/{packId}/import-from-library`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "question_ids": ["uuid-1", "uuid-2", "uuid-3", ...]
}
```

**Example (52 questions from Roxy pack):**
```
POST /api/admin/specials-bank/packs/550e8400-e29b-41d4-a716-446655440099/import-from-library
```

```json
{
  "question_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    ...
  ]
}
```

**Note:** The `pack_id` is now in the URL path (not the request body), following the same pattern as other endpoints like `/api/admin/specials-bank/packs/{packId}/bulk-add` and `/api/admin/specials-bank/packs/{targetPackId}/clone-from/{sourcePackId}`.

---

## What to Check on the Backend

### 1. **Request Body Parsing**
The error "No questions provided" means the backend code is checking if `question_ids` is empty or missing.

**Debug points:**
- Is the endpoint correctly receiving the JSON body?
- Is `params["question_ids"]` populated, or is the code looking for a different field name (e.g., `questionIds` camelCase)?
- Is there any URL parameter parsing happening (e.g., `/importFromLibrary?question_ids=...`) that conflicts with the POST body?

### 2. **Validation Logic**
Find the code that throws "No questions provided" and check:
```
if (!params["question_ids"] || params["question_ids"].empty?) {
  return 400 "No questions provided"
}
```

**Likely causes:**
- Params hash is nil or empty (request body not parsed)
- Field name mismatch: code expects `questionIds` (camelCase) but frontend sends `question_ids` (snake_case)
- The parsed value is empty even though the JSON is valid

### 3. **Content-Type Header**
Confirm the endpoint handler is set up to parse JSON:
- Is the route properly configured to accept `Content-Type: application/json`?
- If it's a Rails controller, is it expecting form data instead? (This would cause params to be empty)

### 4. **Quick Test**
Send a direct cURL request to verify the endpoint receives the data:

```bash
curl -X POST https://bitlyfe-production.up.railway.app/api/admin/specials-bank/packs/550e8400-e29b-41d4-a716-446655440099/import-from-library \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "question_ids": ["550e8400-e29b-41d4-a716-446655440000"]
  }'
```

Check:
- Does it return the same "No questions provided" error?
- If yes → backend bug (body not parsing)
- If it works → frontend might not be sending it correctly (but we've verified the frontend code is correct)

---

## Most Likely Root Cause

**UPDATE:** The frontend endpoint path has been **corrected** to follow the same URL pattern as other specials-bank endpoints:

- **Old (incorrect):** `POST /api/admin/specials-bank/library/importFromLibrary` with `pack_id` in body
- **New (corrected):** `POST /api/admin/specials-bank/packs/{packId}/import-from-library` with only `question_ids` in body

The new endpoint follows the same URL structure as:
- `/api/admin/specials-bank/packs/{packId}/bulk-add` (add questions directly)
- `/api/admin/specials-bank/packs/{targetPackId}/clone-from/{sourcePackId}` (clone from another pack)

This is the correct pattern and should match what the backend expects.

---

## Expected Behavior After Fix

Once fixed, the endpoint should:
1. Accept the request body with `question_ids` array and `pack_id` string
2. Insert each question from the library into the pack's question bank
3. Return HTTP 200 with:
   ```json
   {
     "success": true,
     "data": {
       "inserted": 52
     }
   }
   ```

---

## Frontend Code Reference

**File:** `lib/api.ts` line 1314–1319

```typescript
importFromLibrary: (packId: string, questionIds: string[]) =>
  request<{ inserted: number }>(
    `/api/admin/specials-bank/library/importFromLibrary`,
    { method: "POST", body: { question_ids: questionIds, pack_id: packId }, token: getAdminToken() }
  ),
```

**Usage:** `app/admin/pills/[packId]/bank/page.tsx` line 480

```typescript
await adminApi.importFromLibrary(packId, Array.from(selected));
```

---

## Next Steps

1. Enable request logging on the backend to see what's actually being received
2. Verify JSON parsing middleware is enabled
3. Check the field names match (snake_case on both sides)
4. Test with cURL as shown above
5. Return the raw backend error and stack trace for further debugging
