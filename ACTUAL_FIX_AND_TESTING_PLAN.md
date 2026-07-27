# Actual Fix and Testing Plan

## What I've Done

### 1. Fixed the API Endpoint Paths
**File:** `lib/api.ts` (lines 1259–1274)

**Changed:**
```typescript
// BEFORE (wrong):
PATCH /api/admin/pills/packs/${packId}/questions/${questionId}
DELETE /api/admin/pills/packs/${packId}/questions/${questionId}

// AFTER (correct):
PATCH /api/admin/pills/${questionId}
DELETE /api/admin/pills/${questionId}
```

This is the core fix. The endpoints were pointing to non-existent paths. Backend has direct endpoints at `/api/admin/pills/{id}`.

### 2. Added Comprehensive Debug Logging
**File:** `lib/api.ts` (line 65, 73)
**File:** `app/admin/pills/[packId]/bank/page.tsx` (lines 596–638)

Added console.log statements that will show:
- When buttons are clicked
- When API calls start
- What URL is being called
- What status code comes back
- Any errors that occur

---

## Why This Fixes the Problem

The issue was NOT that the button handlers were disconnected. The issue was that they were calling the wrong API endpoints. By changing the endpoint paths to match what the backend actually provides, the PATCH and DELETE requests will now:

1. ✅ Actually reach the backend
2. ✅ Execute successfully (200 OK instead of 404)
3. ✅ Update/delete the questions in the database
4. ✅ Reload the question list with changes

---

## How to Test and Verify

### Prerequisites
- Dev server running: `npm run dev`
- Open `http://localhost:3000` in browser
- Logged in as admin
- Navigated to Admin → Specials Pack → Manage Question Bank

### Test Edit (5 minutes)

1. **Open DevTools Console** (F12 → Console tab)
2. **Clear logs** (trash icon or `console.clear()`)
3. **Find any question** in the bank list
4. **Click its Edit button**
5. **Look at Console:**
   - You should see: `[handleEdit] Starting edit { packId: "...", questionId: "...", data: {...} }`
   - **If you DON'T see this:** Button handler isn't being called
   - **If you DO see this:** Continue to next step

6. **Edit the question text** (e.g., add " [TEST]" to the end)
7. **Click Save** button
8. **Look at Console again:**
   - You should see: `[handleEdit] Calling updatePackQuestion API...`
   - Then: `[API] PATCH http://localhost:3000/api/admin/pills/{questionId}`
   - Then: `[API] Response: 200 {...}`
   - **If you see 200:** ✅ Edit succeeded!
   - **If you see 404:** Endpoint is still wrong
   - **If you see 401:** Auth token issue
   - **If you see 500:** Backend error

9. **Check if edit form closes and question updates in list**
   - If yes: ✅ Edit works!
   - If no: Check console for errors

### Test Delete (5 minutes)

1. **Clear console logs** again
2. **Find a DIFFERENT question**
3. **Click its Delete button**
4. **Look at Console:**
   - You should see: `[handleDelete] Starting delete { packId: "...", questionId: "..." }`
   - **If you DON'T see this:** Button handler isn't being called

5. **Click Confirm Delete** in the modal
6. **Look at Console again:**
   - You should see: `[handleDelete] Calling deletePackQuestion API...`
   - Then: `[API] DELETE http://localhost:3000/api/admin/pills/{questionId}`
   - Then: `[API] Response: 200 {...}`
   - **If you see 200:** ✅ Delete succeeded!
   - **If you see 404:** Endpoint is still wrong
   - **If you see 401:** Auth token issue

7. **Check if delete modal closes and question disappears**
   - If yes: ✅ Delete works!
   - If no: Check console for errors

---

## What Success Looks Like

### Console Output (Edit):
```
[handleEdit] Starting edit {packId: "550e8400-...", questionId: "abc-123-...", data: {question: "Capital of France? [TEST]", format: "multiple_choice", options: [...], correct_answer: "Paris", timer: 30}}
[handleEdit] Calling updatePackQuestion API...
[API] PATCH http://localhost:3000/api/admin/pills/abc-123-... {body: {question: "Capital of France? [TEST]", format: "multiple_choice", ...}}
[API] Response: 200 {success: true, data: {question: {id: "abc-123-...", question: "Capital of France? [TEST]", ...}}}
[handleEdit] API call succeeded, reloading questions...
```

**UI Changes:**
- Edit form closes
- Question list reloads  
- Question text now shows " [TEST]" addition
- No error messages

### Console Output (Delete):
```
[handleDelete] Starting delete {packId: "550e8400-...", questionId: "def-456-..."}
[handleDelete] Calling deletePackQuestion API...
[API] DELETE http://localhost:3000/api/admin/pills/def-456-... 
[API] Response: 200 {success: true, data: {message: "Question deleted"}}
[handleDelete] API call succeeded, filtering question from list...
```

**UI Changes:**
- Delete modal closes
- Question disappears from list
- Bank health indicator updates
- No error messages

---

## What Failure Looks Like

### If You See 404:
```
[API] PATCH http://localhost:3000/api/admin/pills/abc-123-...
[API] Response: 404 {error: "Not found"}
[handleEdit] Error: ApiError: Request failed (404)
```

**Diagnosis:** Endpoint path is still wrong

**Fix:** Check if backend actually has `/api/admin/pills/{id}` endpoint, or if it uses a different path

### If You See 401:
```
[API] PATCH http://localhost:3000/api/admin/pills/abc-123-...
[API] Response: 401 {error: "Unauthorized"}
```

**Diagnosis:** Admin token is invalid or not being sent

**Fix:** Log out and log back in

### If You Don't See API Logs at All:
```
[handleEdit] Starting edit {...}
[handleEdit] Calling updatePackQuestion API...
(... nothing after this ...)
```

**Diagnosis:** API call failed before being sent, or fetch threw an exception

**Check:**
1. Network tab to see if any request was sent
2. Console for JavaScript errors
3. Is `packId` or `questionId` undefined?

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `lib/api.ts` | Line 1264 | Changed PATCH endpoint to `/api/admin/pills/${questionId}` |
| `lib/api.ts` | Line 1273 | Changed DELETE endpoint to `/api/admin/pills/${questionId}` |
| `lib/api.ts` | Line 65 | Added console.log for API request start |
| `lib/api.ts` | Line 73 | Added console.log for API response |
| `app/admin/pills/[packId]/bank/page.tsx` | Line 597 | Added console.log to handleEdit entry |
| `app/admin/pills/[packId]/bank/page.tsx` | Line 601 | Added console.log before API call |
| `app/admin/pills/[packId]/bank/page.tsx` | Line 603 | Added console.log after API success |
| `app/admin/pills/[packId]/bank/page.tsx` | Line 607 | Added console.error for failures |
| `app/admin/pills/[packId]/bank/page.tsx` | Line 619–637 | Same logging for handleDelete |

---

## Expected Outcomes

### If fix is correct:
- Both Edit and Delete network requests will succeed (200 status)
- Questions will be updated/deleted in the database
- UI will show the changes immediately
- No 404 or other errors

### If endpoints are still wrong:
- You'll see 404 errors in the console
- API calls will fail
- UI won't update
- This tells us the backend endpoints are different from what we expect

### If auth is broken:
- You'll see 401 errors
- Token might not be set or expired
- Need to re-authenticate

---

## How to Use This Information to Debug Further

1. **Run the test and capture the EXACT console output**
2. **Screenshot the Network tab** showing the request and response
3. **Report:**
   - What you saw in Console
   - What status code came back (200, 404, 500, etc.)
   - What the error message was (if any)
   - What the UI did (updated, no change, error message, etc.)

This will give me the exact information needed to fix any remaining issues.

---

## Next Step: You Need to Test This

I've made the code changes and added the logging. Now you need to:

1. Run the dev server
2. Navigate to Question Bank
3. Test Edit and Delete following the steps above
4. Report the EXACT console output and network results

**Then I can:**
- Confirm if the fix worked
- Or identify the remaining issue and fix it
- Or adjust the endpoint path if backend uses something different

---

## Files Ready to Test

✅ `lib/api.ts` — API endpoints fixed
✅ `app/admin/pills/[packId]/bank/page.tsx` — Logging added
✅ Dev server ready to run

**Ready to test!**
