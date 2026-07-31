# Fix: Question Bank Edit & Delete Buttons

## Problem
Edit and Delete buttons on the Question Bank card view weren't firing API requests. Buttons would display UI state change (opening edit form) but no network requests were being sent to the backend.

## Root Cause Analysis

**What was happening:**
1. Click Edit button → Sets `editTarget` state → Opens edit form modal ✓
2. Click Delete button → Sets `deleteTarget` state → Opens delete confirmation modal ✓
3. Confirm edit/delete in modal → Calls API endpoint ✗

**The issue:** The API endpoints were pointing to the wrong path:

**Old (broken):**
```typescript
// lib/api.ts

updatePackQuestion: (packId: string, questionId: string, data: {...}) =>
  request<{ question: PackQuestion }>(
    `/api/admin/pills/packs/${packId}/questions/${questionId}`,  // ❌ WRONG
    { method: "PATCH", body: data, token: getAdminToken() }
  ),

deletePackQuestion: (packId: string, questionId: string) =>
  request<{ message: string }>(
    `/api/admin/pills/packs/${packId}/questions/${questionId}`,  // ❌ WRONG
    { method: "DELETE", token: getAdminToken() }
  ),
```

**Backend expects:** Direct pill endpoints, not nested under packs:
```
PATCH /api/admin/pills/{pillId}
DELETE /api/admin/pills/{pillId}
```

**New (fixed):**
```typescript
updatePackQuestion: (packId: string, questionId: string, data: {...}) =>
  request<{ question: PackQuestion }>(
    `/api/admin/pills/${questionId}`,  // ✅ CORRECT
    { method: "PATCH", body: data, token: getAdminToken() }
  ),

deletePackQuestion: (packId: string, questionId: string) =>
  request<{ message: string }>(
    `/api/admin/pills/${questionId}`,  // ✅ CORRECT
    { method: "DELETE", token: getAdminToken() }
  ),
```

## What Was Fixed

**File:** `lib/api.ts` (lines 1259–1274)

**Changes:**
1. Line 1264: `PATCH /api/admin/pills/packs/${packId}/questions/${questionId}` → `PATCH /api/admin/pills/${questionId}`
2. Line 1273: `DELETE /api/admin/pills/packs/${packId}/questions/${questionId}` → `DELETE /api/admin/pills/${questionId}`

**The fix:**
- Question IDs ARE pill IDs
- Backend has direct endpoints on the pills resource
- No need to nest under pack path
- Both endpoints now call the correct API path

## How It Works Now

**Edit flow:**
1. Admin clicks Edit button on a question card
2. Edit form modal opens with question data
3. Admin edits the question text/options/answer
4. Admin clicks Save
5. Frontend calls: `PATCH /api/admin/pills/{questionId}` with updated data
6. Backend updates the question in DB
7. Frontend reloads question bank and closes modal

**Delete flow:**
1. Admin clicks Delete button on a question card
2. Delete confirmation modal opens
3. Admin confirms the deletion
4. Frontend calls: `DELETE /api/admin/pills/{questionId}`
5. Backend soft-deletes the question (marks as deleted)
6. Frontend filters question from the list
7. Modal closes

## Testing Steps

**To verify the fix works:**

1. **Open admin > Specials Packs**
2. **Select a pack** with at least 1 question (e.g., Roxy)
3. **Click "Manage Question Bank"**
4. **Find a question card**
5. **Click the Edit button**
   - Expected: Edit form opens
   - Check Network tab: Should see no request yet (form just opened)
6. **Change the question text** (e.g., add "EDITED" to the end)
7. **Click Save**
   - Expected: Should see `PATCH /api/admin/pills/{id}` request in Network tab
   - Response should be `{ "success": true, "data": { "question": {...} } }`
   - Question text should update in the card
8. **Find another question**
9. **Click the Delete button**
   - Expected: Delete confirmation modal appears
   - Check Network tab: Should see no request yet
10. **Click Confirm Delete**
    - Expected: Should see `DELETE /api/admin/pills/{id}` request in Network tab
    - Response should be `{ "success": true, "data": { "message": "..." } }`
    - Question should disappear from the list

## Verification Checklist

- [x] Code change applied to lib/api.ts
- [x] Endpoint paths now match backend expectations
- [ ] Edit functionality tested on real pack
- [ ] Delete functionality tested on real pack
- [ ] Network tab confirms requests are firing
- [ ] DB verified that changes persisted

## Status

✅ **Frontend code fixed** — API endpoints now call the correct paths  
⏳ **Testing required** — Needs manual verification on real pack data

## Related Information

- Backend endpoints (confirmed working):
  - `PATCH /api/admin/pills/{id}` — Update question
  - `DELETE /api/admin/pills/{id}` — Delete question
  
- Question bank card component: `app/admin/pills/[packId]/bank/page.tsx`
  - Lines 795–802: Edit and Delete button handlers
  - Lines 595–609: `handleEdit` and `handleDelete` function definitions
  - These now correctly call the fixed API endpoints
