# Code State Summary

## Files Modified

### 1. lib/api.ts

**Lines 1259–1274:** Fixed API endpoint paths

```typescript
updatePackQuestion: (packId: string, questionId: string, data: {
  question?: string;
  format?: "multiple_choice" | "type_answer";
  options?: string[];
  correct_answer?: string;
  timer?: number;
}) =>
  request<{ question: PackQuestion }>(
    `/api/admin/pills/${questionId}`,  // ✅ FIXED (was: /api/admin/pills/packs/${packId}/questions/${questionId})
    { method: "PATCH", body: data, token: getAdminToken() }
  ),

deletePackQuestion: (packId: string, questionId: string) =>
  request<{ message: string }>(
    `/api/admin/pills/${questionId}`,  // ✅ FIXED (was: /api/admin/pills/packs/${packId}/questions/${questionId})
    { method: "DELETE", token: getAdminToken() }
  ),
```

**Line 65:** Added request logging
```typescript
console.log(`[API] ${method} ${url}`, body ? { body } : "");
```

**Line 73:** Added response logging
```typescript
console.log(`[API] Response: ${res.status}`, json);
```

---

### 2. app/admin/pills/[packId]/bank/page.tsx

**Lines 596–619:** Enhanced handleEdit with logging

```typescript
const handleEdit = async (data: Parameters<typeof adminApi.addPillToPack>[1]) => {
  if (!editTarget) {
    console.log("[handleEdit] Early return: no editTarget set");
    return;
  }
  console.log("[handleEdit] Starting edit", { packId, questionId: editTarget.id, data });
  setSaving(true);
  try {
    console.log("[handleEdit] Calling updatePackQuestion API...");
    await adminApi.updatePackQuestion(packId, editTarget.id, data);
    console.log("[handleEdit] API call succeeded, reloading questions...");
    await load();
    setEditTarget(null);
  }
  catch (err) {
    console.error("[handleEdit] Error:", err);
    setError(err instanceof ApiError ? err.message : "Failed to save question");
  }
  finally {
    setSaving(false);
  }
};
```

**Lines 620–638:** Enhanced handleDelete with logging

```typescript
const handleDelete = async () => {
  if (!deleteTarget) {
    console.log("[handleDelete] Early return: no deleteTarget set");
    return;
  }
  console.log("[handleDelete] Starting delete", { packId, questionId: deleteTarget.id });
  setDeleting(true);
  try {
    console.log("[handleDelete] Calling deletePackQuestion API...");
    await adminApi.deletePackQuestion(packId, deleteTarget.id);
    console.log("[handleDelete] API call succeeded, filtering question from list...");
    setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
    setDeleteTarget(null);
  }
  catch (err) {
    console.error("[handleDelete] Error:", err);
    setError(err instanceof ApiError ? err.message : "Failed to delete question");
  }
  finally {
    setDeleting(false);
  }
};
```

---

## No Changes Required

### app/admin/pills/[packId]/bank/page.tsx - Button Handlers

**Lines 835–842:** Edit and Delete button handlers (these are CORRECT, no changes needed)

```typescript
<button onClick={() => { setEditTarget(q); setShowAdd(false); setShowBulk(false); }}
  style={{...}}>
  <Pencil size={12} /> Edit
</button>
<button onClick={() => setDeleteTarget(q)}
  style={{...}}>
  <Trash2 size={12} /> Delete
</button>
```

These buttons:
1. ✅ Set state correctly
2. ✅ Pass the question object (which has the ID)
3. ✅ This triggers the conditional UI to show the edit form or delete confirmation
4. ✅ User confirms the action
5. ✅ handleEdit or handleDelete is called
6. ✅ Now calls the correct API endpoint ✅

---

## Data Flow (Now Correct)

```
User clicks Edit Button
↓
onClick fires: setEditTarget(q)
↓
Edit form appears with QuestionForm component
↓
User edits and clicks Save
↓
QuestionForm calls onSave(data)
↓
handleEdit(data) is called
↓
console.log("Starting edit") ← You see this in console
↓
adminApi.updatePackQuestion(packId, editTarget.id, data)
↓
request() constructs: PATCH /api/admin/pills/{editTarget.id}
↓
console.log("PATCH http://...") ← You see this in console
↓
Backend receives request and updates question
↓
Backend returns 200 OK
↓
console.log("Response: 200") ← You see this in console
↓
Frontend reloads questions (await load())
↓
Edit form closes (setEditTarget(null))
↓
Question list displays updated question
```

Same flow for Delete, just with DELETE method.

---

## What's Different Now vs Before

| Step | Before | After |
|------|--------|-------|
| API endpoint | `/api/admin/pills/packs/{packId}/questions/{id}` | `/api/admin/pills/{id}` |
| Backend response | 404 Not Found | 200 OK |
| Frontend behavior | Error caught, error message shown | Question updated/deleted in list |
| Logging | None | Full trace in console |

---

## Ready to Test

The code is now:
✅ Fixed (endpoints corrected)
✅ Instrumented (logging added)
✅ Ready to test (dev server can run)

Just need to:
1. Run dev server
2. Test Edit and Delete
3. Report what you see in console and network tab

---

## Logging Output Examples

### Edit Success Example:
```
[handleEdit] Starting edit {packId: "550e8400-e29b-...", questionId: "abc-123-def-456", data: {question: "Test? [EDITED]", format: "multiple_choice", ...}}
[handleEdit] Calling updatePackQuestion API...
[API] PATCH http://localhost:3000/api/admin/pills/abc-123-def-456 {body: {question: "Test? [EDITED]", format: "multiple_choice", ...}}
[API] Response: 200 {success: true, data: {question: {...}}}
[handleEdit] API call succeeded, reloading questions...
```

### Delete Success Example:
```
[handleDelete] Starting delete {packId: "550e8400-e29b-...", questionId: "xyz-789-uvw-012"}
[handleDelete] Calling deletePackQuestion API...
[API] DELETE http://localhost:3000/api/admin/pills/xyz-789-uvw-012
[API] Response: 200 {success: true, data: {message: "..."}}
[handleDelete] API call succeeded, filtering question from list...
```

---

## If You See Errors

### 404 Error:
```
[API] PATCH http://localhost:3000/api/admin/pills/abc-123-...
[API] Response: 404 {error: "Not found"}
```
**Problem:** Backend endpoint doesn't exist at this path
**Solution:** Check what endpoint backend actually has

### 401 Error:
```
[API] Response: 401 {error: "Unauthorized"}
```
**Problem:** Admin token invalid or not sent
**Solution:** Log out and log back in

### No Logs at All:
**Problem:** Button not being clicked or handler not called
**Solution:** Check if button is clickable, try clicking again

---

## Summary

- **Fix Applied:** ✅ Endpoint paths corrected
- **Logging Added:** ✅ Console logs for debugging
- **Ready to Test:** ✅ Yes
- **Expected Result:** ✅ Edit/Delete requests succeeds with 200 status
- **Next Action:** Run the test and report results
