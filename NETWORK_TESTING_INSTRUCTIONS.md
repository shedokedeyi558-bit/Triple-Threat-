# Network Testing: Question Bank Edit & Delete

**IMPORTANT:** This document provides exact steps to verify the Edit and Delete functionality works. You must follow these steps and report the EXACT network requests you see.

---

## Setup

### 1. Start the Dev Server
```bash
npm run dev
```
Wait for: `✓ Ready in X.Xs`

### 2. Open the App
- Go to: `http://localhost:3000`
- The app should load on localhost (not the production backend)

### 3. Log In as Admin
- Enter phone and verify OTP
- (If you need test admin credentials, check .env.local)

---

## Test Procedure: EDIT Functionality

### Step 1: Navigate to Question Bank
1. Click "Admin" or go to `/admin/pills`
2. Click on any Specials pack (e.g., "Roxy")
3. Click "Manage Question Bank"
4. You should see a list of question cards

### Step 2: Open DevTools Network Tab
1. Press `Ctrl+Shift+I` (or F12)
2. Go to the **Network** tab
3. **Clear existing requests** (click the trash icon)
4. Leave DevTools open

### Step 3: Edit a Question
1. Find any question card in the list
2. Click the **Edit** button
3. An edit form should appear below the question card
4. Check **Browser Console** (not Network yet):
   - Should see: `[handleEdit] Starting edit`
   - This proves the Edit button handler fired

### Step 4: Modify the Question
1. In the edit form, change the question text
   - E.g., add " [EDITED BY TEST]" at the end
2. Leave other fields unchanged
3. Click **Save** button

### Step 5: Capture Network Request
1. Look at the **Network** tab
2. **You should see a request appear** (this is what we're checking for)
3. Click on that request and note:
   - **URL**: Full request URL
   - **Method**: Should be `PATCH`
   - **Status**: Should be `200` or `201` (not 404 or 5xx)
   - **Request Headers**: Look for `Authorization: Bearer ...`
   - **Request Body**: Should include the updated question text
   - **Response Body**: Should include the updated question data

### Step 6: Expected Network Request

```
Request URL: http://localhost:3000/api/admin/pills/{questionId}
Request Method: PATCH
Status Code: 200
Content-Type: application/json

Request Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json

Request Body (JSON):
{
  "question": "What is the capital of France? [EDITED BY TEST]",
  "format": "multiple_choice",
  "options": ["Paris", "London", "Berlin", "Madrid"],
  "correct_answer": "Paris",
  "timer": 30
}

Response Body (JSON):
{
  "success": true,
  "data": {
    "question": {
      "id": "550e8400-...",
      "question": "What is the capital of France? [EDITED BY TEST]",
      "format": "multiple_choice",
      "options": ["Paris", "London", "Berlin", "Madrid"],
      "correct_answer": "Paris",
      ...
    }
  }
}
```

### Step 7: Verify in UI
1. Edit modal should close
2. Question list should reload
3. The question should show your edited text (with " [EDITED BY TEST]")
4. If all of this happened: **Edit works! ✅**

---

## Test Procedure: DELETE Functionality

### Step 1: Open DevTools Network Tab Again
1. Go back to the Question Bank (if not already there)
2. Open DevTools → Network tab
3. **Clear existing requests** (trash icon)

### Step 2: Select a Question to Delete
1. Find a DIFFERENT question card (not the one you just edited)
2. Click the **Delete** button
3. A delete confirmation modal should appear
4. Check **Browser Console**:
   - Should see: `[handleDelete] Starting delete`
   - This proves the Delete button handler fired

### Step 3: Confirm Delete
1. In the confirmation modal, click **Confirm Delete**
2. Check **Browser Console** again:
   - Should see: `[handleDelete] Calling deletePackQuestion API...`

### Step 4: Capture Network Request
1. Look at the **Network** tab
2. **You should see a DELETE request appear**
3. Click on that request and note:
   - **URL**: Full request URL
   - **Method**: Should be `DELETE`
   - **Status**: Should be `200` (not 404 or 5xx)
   - **Request Headers**: Authorization header should be present
   - **Response Body**: Should indicate success

### Step 5: Expected Network Request

```
Request URL: http://localhost:3000/api/admin/pills/{questionId}
Request Method: DELETE
Status Code: 200
Content-Type: application/json

Request Headers:
  Authorization: Bearer eyJhbGc...
  Content-Type: application/json

Request Body: (empty for DELETE)

Response Body (JSON):
{
  "success": true,
  "data": {
    "message": "Question deleted successfully"
  }
}
```

### Step 6: Verify in UI
1. Delete modal should close
2. Question list should reload
3. The deleted question should be GONE from the list
4. Bank health indicator should update
5. If all of this happened: **Delete works! ✅**

---

## Troubleshooting: If No Network Request Appears

### Check 1: Browser Console
1. Open DevTools → **Console** tab
2. Look for logs starting with `[API]` or `[handleEdit]`
3. If you see them, requests ARE being made (check Network tab, they might be filtered)
4. If you DON'T see them, the button handler isn't being called

### Check 2: Network Tab Filters
1. In Network tab, check if there are any filters applied
2. Look for a filter input that might be hiding requests
3. Clear any filters
4. Try again

### Check 3: Throttling
1. In Network tab, check if throttling is enabled (usually shows "No throttling")
2. If requests are being throttled, requests might appear slowly
3. Wait a few seconds for the request to appear

### Check 4: Check for Errors
1. If a request appears but fails (404, 500, etc.):
   - Note the exact error
   - Check the Response tab to see the error message
   - This helps identify what's wrong

### Check 5: Browser Console Errors
1. Look for any red errors in the Console tab
2. Common errors:
   - `TypeError: cannot read property...` — Some data is missing
   - `Failed to fetch` — Network/CORS issue
   - `401 Unauthorized` — Auth token invalid

---

## What to Report

When you test, **REPORT THE EXACT DETAILS:**

### For Edit:
```
✅ or ❌ (did it work?)

Network Request Details:
- URL: [exact URL from Network tab]
- Method: [GET/POST/PATCH/DELETE]
- Status: [200, 404, 500, etc.]
- Response Time: [X ms]

Request Body (from Network tab):
[paste the JSON body]

Response Body (from Network tab):
[paste the JSON response]

Browser Console (from Console tab):
[any logs or errors]

UI Result:
[Did the question text update?]
[Did the modal close?]
[Is there an error message?]
```

### For Delete:
```
✅ or ❌ (did it work?)

Network Request Details:
- URL: [exact URL]
- Method: [GET/POST/PATCH/DELETE]
- Status: [200, 404, 500, etc.]

Response Body:
[paste the JSON response]

Browser Console:
[any logs or errors]

UI Result:
[Did the question disappear?]
[Did the modal close?]
[Is there an error message?]
```

---

## Console Logs to Look For

After my code changes, you should see these logs in the Console tab when you click buttons:

### When you click Edit button:
```
[handleEdit] Starting edit {packId: "...", questionId: "...", data: {...}}
```

### When you click Save in edit form:
```
[handleEdit] Calling updatePackQuestion API...
[API] PATCH http://localhost:3000/api/admin/pills/{questionId} {body: {...}}
[API] Response: 200 {success: true, data: {...}}
[handleEdit] API call succeeded, reloading questions...
```

### When you click Delete button:
```
[handleDelete] Starting delete {packId: "...", questionId: "..."}
```

### When you confirm delete:
```
[handleDelete] Calling deletePackQuestion API...
[API] DELETE http://localhost:3000/api/admin/pills/{questionId}
[API] Response: 200 {success: true, data: {...}}
[handleDelete] API call succeeded, filtering question from list...
```

---

## If You See No Logs

1. **Logs not appearing?** Might be because they're logged before Network tab filters kick in
2. **Check:**
   - Is your button really getting clicked? (Try clicking it multiple times)
   - Do you see the edit form/delete confirmation appear? (If yes, state is changing)
   - Can you see logs in Console tab?

---

## Next Steps After Testing

1. **Run the test** following these exact steps
2. **Capture screenshots** of:
   - Network tab showing the request
   - Request headers
   - Request body
   - Response body
   - Console logs
3. **Report your findings** with the exact network request details
4. **If it works:** Great! ✅
5. **If it doesn't work:** Share the network error details so I can fix it

---

## Quick Summary

| Action | Expected Request | Expected Status | UI Change |
|--------|------------------|-----------------|-----------|
| Click Edit button | No request yet | - | Edit form appears |
| Click Save | PATCH /api/admin/pills/{id} | 200 | Modal closes, question updates |
| Click Delete button | No request yet | - | Confirmation modal appears |
| Confirm Delete | DELETE /api/admin/pills/{id} | 200 | Modal closes, question disappears |

---

**Ready to test? Follow the steps above and report back with your findings!**
