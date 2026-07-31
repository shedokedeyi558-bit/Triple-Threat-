# Debug Changes Made

To help diagnose the Edit/Delete button issue, I've added comprehensive logging to the codebase.

---

## Changes Made

### 1. **Enhanced Request Logging** (`lib/api.ts`)

Added logging to the `request()` function to show all network requests:

```typescript
// Added after constructing URL:
console.log(`[API] ${method} ${url}`, body ? { body } : "");

// Added after receiving response:
console.log(`[API] Response: ${res.status}`, json);
```

This means **every API call will log to the browser console** with:
- The HTTP method (GET, POST, PATCH, DELETE)
- The exact URL being called
- The status code
- The response body

### 2. **Enhanced Handler Logging** (`app/admin/pills/[packId]/bank/page.tsx`)

Updated `handleEdit()` function to log:
```typescript
console.log("[handleEdit] Early return: no editTarget set"); // if editTarget is null
console.log("[handleEdit] Starting edit", { packId, questionId: editTarget.id, data });
console.log("[handleEdit] Calling updatePackQuestion API...");
console.log("[handleEdit] API call succeeded, reloading questions...");
console.error("[handleEdit] Error:", err); // if error occurs
```

Updated `handleDelete()` function to log:
```typescript
console.log("[handleDelete] Early return: no deleteTarget set"); // if deleteTarget is null
console.log("[handleDelete] Starting delete", { packId, questionId: deleteTarget.id });
console.log("[handleDelete] Calling deletePackQuestion API...");
console.log("[handleDelete] API call succeeded, filtering question from list...");
console.error("[handleDelete] Error:", err); // if error occurs
```

---

## What These Logs Tell Us

### When Testing Edit:
1. **See `[handleEdit] Starting edit`?**
   - YES → Edit button clicked and handler called ✅
   - NO → Button not working (check if element is clickable)

2. **See `[API] PATCH`?**
   - YES → API call was made ✅
   - NO → Handler executed but API call didn't fire

3. **See `[API] Response: 200`?**
   - YES → Server responded successfully ✅
   - NO → See the status code, it tells us the error (404, 500, 401, etc.)

4. **See `[handleEdit] API call succeeded`?**
   - YES → Full flow completed ✅
   - NO → See `[handleEdit] Error:` for the exception

### When Testing Delete:
Same logic as above but for `[handleDelete]` and DELETE requests.

---

## How to Use These Logs

### Step 1: Open Browser Console
- F12 → Console tab

### Step 2: Clear Existing Logs
- Click the trash icon or type: `console.clear()`

### Step 3: Perform Action
- Click Edit button
- Make a change
- Click Save

### Step 4: Check Console Output
Look for logs in this order:
1. `[handleEdit] Starting edit`
2. `[handleEdit] Calling updatePackQuestion API...`
3. `[API] PATCH http://localhost:3000/api/admin/pills/{id}`
4. `[API] Response: 200 {...}`
5. `[handleEdit] API call succeeded...`

If you see ALL 5, **Edit is working! ✅**

If you see gaps, you've identified where it breaks.

---

## Expected Console Output: SUCCESS Case

```
[handleEdit] Starting edit {packId: "abc-123", questionId: "def-456", data: {question: "...", format: "multiple_choice", ...}}
[handleEdit] Calling updatePackQuestion API...
[API] PATCH http://localhost:3000/api/admin/pills/def-456 {body: {question: "...", format: "multiple_choice", ...}}
[API] Response: 200 {success: true, data: {question: {id: "def-456", question: "...", ...}}}
[handleEdit] API call succeeded, reloading questions...
```

Then you should see the edit form close and the question list reload.

---

## Expected Console Output: FAILURE Cases

### If Button Not Clicked:
- **You don't see `[handleEdit] Starting edit`**
- Check: Is the button really clickable? Try clicking it again.

### If API Call Not Made:
- **You see `[handleEdit] Starting edit` BUT NOT `[API] PATCH`**
- Problem: `handleEdit` ran but `updatePackQuestion()` didn't execute
- Check: Is `packId` or `editTarget.id` undefined?

### If API Request Fails:
- **You see `[API] PATCH ... Response: 404`**
- Problem: URL is wrong or backend endpoint doesn't exist
- Check: Is `/api/admin/pills/{id}` the right endpoint on your backend?

- **You see `[API] PATCH ... Response: 401`**
- Problem: Authentication failed
- Check: Is admin token valid? Did you log out?

- **You see `[API] PATCH ... Response: 500`**
- Problem: Backend error
- Check: Backend logs for what went wrong

### If Error Caught:
- **You see `[handleEdit] Error: {...}`**
- The exception message tells you what failed
- Common: "Invalid JSON response", "Network error", etc.

---

## Files Modified

```
lib/api.ts
- Line 65: Added console.log for request start
- Line 73: Added console.log for response received

app/admin/pills/[packId]/bank/page.tsx
- Lines 596-619: Enhanced handleEdit with logging
- Lines 620-638: Enhanced handleDelete with logging
```

---

## Next Steps

1. **Run the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the app** at `http://localhost:3000`

3. **Log in** as admin

4. **Open Console** (F12 → Console tab)

5. **Navigate** to Admin → Specials → Pack → Manage Question Bank

6. **Test Edit:**
   - Click Edit button
   - Observe console logs
   - Change question text
   - Click Save
   - Report the exact logs you see

7. **Test Delete:**
   - Click Delete button
   - Observe console logs
   - Confirm delete
   - Report the exact logs you see

---

## To Remove Logs Later

When debugging is complete, remove these lines:

From `lib/api.ts`:
- Line 65: Remove the console.log call
- Line 73: Remove the console.log call

From `app/admin/pills/[packId]/bank/page.tsx`:
- Remove all `console.log` and `console.error` calls from handleEdit and handleDelete

---

## Important

**DO NOT** deploy with these logs to production. They will fill up user console and might impact performance. These are for debugging only.

Use this after you've confirmed everything works.
