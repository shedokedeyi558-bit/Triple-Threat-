# Testing Guide: Question Bank Edit & Delete

## Quick Test (5 minutes)

### Setup
1. Open browser DevTools → Network tab (Ctrl+Shift+I → Network)
2. Go to Admin → Specials Packs
3. Select "Roxy" or any pack with questions
4. Click "Manage Question Bank"

### Test Edit Functionality

**Step 1: Open Edit Form**
- Click the Edit button on any question card
- Network tab: Should show NO requests (just UI state change)
- Expected: Form modal opens with question text populated

**Step 2: Make a Change**
- In the edit form, change the question text (add " [TEST EDIT]" to the end)
- Leave other fields as-is
- Click "Save"

**Step 3: Verify Request**
- Network tab: Should show `PATCH /api/admin/pills/{questionId}`
- Request headers should have: `Authorization: Bearer <token>`
- Request body should include: `{ "question": "...[TEST EDIT]" }`
- Response should be: `{ "success": true, "data": { "question": {...} } }`

**Step 4: Verify in UI**
- Edit form should close
- Question bank should reload
- The edited question should show the new text (with " [TEST EDIT]")
- Success! ✅

---

### Test Delete Functionality

**Step 1: Find a Question to Delete**
- Select a different question card (not the one you just edited)
- Click the Delete button

**Step 2: Confirm Delete**
- Network tab: Should show NO requests yet (just opened confirmation modal)
- Delete confirmation modal should appear asking to confirm
- Click "Confirm Delete" button

**Step 3: Verify Request**
- Network tab: Should show `DELETE /api/admin/pills/{questionId}`
- Request headers should have: `Authorization: Bearer <token>`
- Response should be: `{ "success": true, "data": { "message": "..." } }`

**Step 4: Verify in UI**
- Delete modal should close
- Question bank should reload
- The deleted question should be GONE from the list
- Bank health indicator should update (fewer questions)
- Success! ✅

---

## Detailed Network Tab Checks

### Edit Request
```
Request URL: https://bitlyfe-production.up.railway.app/api/admin/pills/{pillId}
Request Method: PATCH
Status Code: 200 OK

Headers:
- Content-Type: application/json
- Authorization: Bearer eyJhbGc...

Body:
{
  "question": "What is the capital of France? [TEST EDIT]",
  "format": "multiple_choice",
  "options": ["Paris", "London", "Berlin", "Madrid"],
  "correct_answer": "Paris",
  "timer": 30
}

Response:
{
  "success": true,
  "data": {
    "question": {
      "id": "550e8400-...",
      "question": "What is the capital of France? [TEST EDIT]",
      "format": "multiple_choice",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      "timer": 30,
      ...
    }
  }
}
```

### Delete Request
```
Request URL: https://bitlyfe-production.up.railway.app/api/admin/pills/{pillId}
Request Method: DELETE
Status Code: 200 OK

Headers:
- Authorization: Bearer eyJhbGc...

Body: (empty for DELETE)

Response:
{
  "success": true,
  "data": {
    "message": "Question deleted successfully"
  }
}
```

---

## Troubleshooting

### Issue: No network request appears when clicking Save/Confirm Delete
**Likely cause:** Button handler not connected or state management issue
**Solution:** Check browser console for JavaScript errors, verify the API call is being made

### Issue: 404 error on the request
**Likely cause:** Endpoint path is wrong or pill ID is invalid
**Solution:** Verify the pill ID in the URL matches a real question UUID in the database

### Issue: 401 Unauthorized
**Likely cause:** Admin token is invalid or expired
**Solution:** Log out and log back in, verify the admin token is being sent in headers

### Issue: Edit/Delete succeeds in network tab but UI doesn't update
**Likely cause:** Frontend state not being refreshed after successful response
**Solution:** Check that `load()` function is being called to reload questions

### Issue: Question still appears after delete (soft delete issue)
**Expected behavior:** Backend soft-deletes (marks as deleted), frontend filters it out
**If still visible:** Check that frontend is filtering deleted=true items, or backend isn't actually marking as deleted

---

## Success Criteria

All of these should be true after the fix:

✅ Edit button opens form without making network request  
✅ Save button sends PATCH request to `/api/admin/pills/{id}`  
✅ PATCH request includes updated question data in body  
✅ PATCH response is 200 OK with updated question  
✅ Question text updates in card after save  
✅ Delete button opens confirmation modal without making network request  
✅ Confirm delete button sends DELETE request to `/api/admin/pills/{id}`  
✅ DELETE response is 200 OK with success message  
✅ Question disappears from list after deletion  
✅ Bank health indicator updates (fewer questions)  
✅ No JavaScript errors in browser console  

---

## Test Data

### Roxy Pack Details
- Pack ID: (shown in URL or pack details)
- Questions: ~52 questions in bank
- Format: Multiple choice
- Status: Should be able to edit/delete any question

### Create Test Pack (if needed)
If Roxy is locked or you need a fresh pack:
1. Go to Admin → Specials Packs → Create Pack
2. Fill in details (name, category, fee, prize)
3. After creation, you'll be sent to Question Bank
4. Add a question manually using the "Add" button
5. Use that question for edit/delete testing

---

## Rollback Plan

If the fix causes issues:

1. Revert the API endpoints back to:
   - `PATCH /api/admin/pills/packs/${packId}/questions/${questionId}`
   - `DELETE /api/admin/pills/packs/${packId}/questions/${questionId}`

2. Or confirm if backend has different endpoint structure

---

## Next Steps After Testing

- [ ] Run full test suite
- [ ] Test on different question types (multiple choice, type answer)
- [ ] Test on different packs
- [ ] Test error scenarios (invalid ID, auth failure, etc.)
- [ ] Check browser console for any warnings/errors
- [ ] Deploy to production once verified
