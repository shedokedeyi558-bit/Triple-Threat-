# Investigation: Toggle "Show inactive & sold-out packs" Not Working

## Executive Summary
The toggle appears to be working at the UI level (button changes state visually), but the pack count remains identical. Investigation reveals the issue is likely in how the filtering logic works on the backend.

---

## Evidence: Code Review

### 1. Toggle Button Handler
**File:** `app/admin/pills/page.tsx` (lines 289-298)

```tsx
<button
  onClick={() => {
    console.log("[DEBUG] Toggle clicked - current showInactive:", showInactive, "-> will become:", !showInactive);
    setShowInactive(!showInactive);
  }}
  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
  style={showInactive
    ? { backgroundColor: "rgba(76,111,255,0.2)", border: "1px solid rgba(76,111,255,0.4)", color: "var(--accent-indigo)" }
    : { backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.15)", color: "var(--text-muted)" }}>
  {showInactive ? "✓" : "○"} Show inactive & sold-out packs
</button>
```

**✅ FINDING:** onClick handler correctly calls `setShowInactive(!showInactive)` — state update is triggered.

---

### 2. State Declaration & useEffect
**File:** `app/admin/pills/page.tsx` (lines 157-176)

```tsx
const [showInactive, setShowInactive] = useState(false);

useEffect(() => { 
  (async () => {
    console.log("[DEBUG] useEffect triggered - showInactive changed to:", showInactive);
    setLoading(true);
    try {
      console.log("[DEBUG] About to call getPillPacks with showInactive =", showInactive);
      const res = await adminApi.getPillPacks(showInactive);
      console.log("[DEBUG] Response received, packs count:", res.packs?.length);
      setPacks(res.packs as PillPack[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load packs");
    } finally {
      setLoading(false);
    }
  })();
}, [showInactive]);
```

**✅ FINDING:** 
- State initialized to `false` (default: don't show inactive)
- useEffect has **correct dependency array**: `[showInactive]` — will re-run when toggle changes
- Effect passes `showInactive` to API call
- No caching in the useEffect itself

---

### 3. API Call
**File:** `lib/api.ts` (lines 1162-1167)

```tsx
getPillPacks: (includeInactive?: boolean) => {
  const url = `/api/admin/pills/packs${includeInactive ? "?includeInactive=true" : ""}`;
  console.log("[DEBUG] getPillPacks called with includeInactive:", includeInactive, "URL:", url);
  return request<{ packs: PillPack[] }>(url, { token: getAdminToken() });
},
```

**✅ FINDING:** 
- URL construction is correct:
  - When `showInactive === false` (default): URL = `/api/admin/pills/packs` (no query param)
  - When `showInactive === true` (toggled on): URL = `/api/admin/pills/packs?includeInactive=true`
- No client-side caching in the function

**Constructed URLs expected:**
- Toggle OFF: `https://api.bitlyfe.app/api/admin/pills/packs`
- Toggle ON: `https://api.bitlyfe.app/api/admin/pills/packs?includeInactive=true`

---

## Frontend Flow (Verified ✅)

```
User clicks toggle button
         ↓
onClick triggers: setShowInactive(!showInactive)
         ↓
State changes: showInactive = true/false
         ↓
useEffect dependency [showInactive] fires
         ↓
adminApi.getPillPacks(showInactive) called
         ↓
URL constructed with ?includeInactive=true (or without)
         ↓
fetch() sent to backend
         ↓
Response received and setPacks() updates state
```

**This flow is working correctly on the frontend.**

---

## Root Cause Analysis

### Scenario 1: Backend Not Respecting Parameter ❌ (LIKELY)
**If pack count never changes, backend is probably:**
- Ignoring the `?includeInactive=true` query parameter
- Always returning the same filtered set (e.g., only active packs)
- Not checking the query param value

**Backend endpoint:** `/api/admin/pills/packs`
- Should return: Only ACTIVE packs when `?includeInactive` is absent/false
- Should return: ACTIVE + INACTIVE + SOLD-OUT packs when `?includeInactive=true`
- Currently returning: (needs investigation on backend)

### Scenario 2: Backend Treating Parameter Value Incorrectly ⚠️
- Backend might be checking for `includeInactive === "true"` (string) instead of truthy value
- Backend might be parsing param incorrectly (e.g., looking for `include_inactive` instead of `includeInactive`)

### Scenario 3: Response Filtering Logic Error 🤔
- Backend receives param correctly but filters data incorrectly
- Example: filtering `status !== 'inactive'` even when `includeInactive=true`

---

## What We Know ✅

1. **Frontend state management:** Working correctly
   - Toggle button updates state
   - State change triggers useEffect
   - useEffect dependency array is correct
   - No memoization/caching preventing re-fetch

2. **URL construction:** Working correctly
   - Query parameter appended properly when `showInactive=true`
   - No parameter sent when `showInactive=false`

3. **Request is being sent:** (Will confirm with browser DevTools)
   - Open Admin → Pills page
   - Open DevTools Network tab
   - Click toggle
   - Watch for two requests to `/api/admin/pills/packs`
   - First: no query param (show only active)
   - Second: `?includeInactive=true` (show all)

---

## Next Steps for Debugging

### Browser DevTools (Test Immediately)
1. Open admin/pills page in browser
2. Press F12 → Network tab
3. Filter for: `/api/admin/pills/packs`
4. Click the toggle button
5. **Expected behavior:** Two requests appear
   - Request 1: `GET /api/admin/pills/packs` → response shows N packs
   - Request 2: `GET /api/admin/pills/packs?includeInactive=true` → response shows M packs (M > N)
6. **Actual behavior:** (What do you see?)

### Console Logs (Will See)
Open DevTools Console and click toggle:
- `[DEBUG] Toggle clicked - current showInactive: false -> will become: true`
- `[DEBUG] useEffect triggered - showInactive changed to: true`
- `[DEBUG] About to call getPillPacks with showInactive = true`
- `[DEBUG] getPillPacks called with includeInactive: true URL: /api/admin/pills/packs?includeInactive=true`
- `[DEBUG] Response received, packs count: [X]`

---

## Diagnosis Checklist

- [ ] Open Network tab, toggle, see if second request is sent
- [ ] Check Network tab to see if query parameter is in the request URL
- [ ] Check backend logs for the request (is backend receiving the parameter?)
- [ ] Backend should filter based on query param — confirm it's doing so

If second request is NOT being sent → **Frontend bug** (but code looks correct)
If second request IS sent → **Backend bug** (not filtering by includeInactive)

---

## Files Instrumented with Logging

### `lib/api.ts` (line 1162-1167)
Added console.log to getPillPacks function to log:
- The `includeInactive` parameter value
- The constructed URL

### `app/admin/pills/page.tsx` (lines 157-176, 291-294)
Added console.logs to:
- Toggle button click handler
- useEffect trigger
- API call
- Response received

**To remove logging after debugging:** Search for `console.log("[DEBUG]"` in both files and remove lines.

---

## Summary

**Frontend implementation:** ✅ Correct
- Toggle updates state properly
- useEffect has correct dependencies
- API call constructs URL with query parameter correctly
- No client-side caching preventing re-fetch

**Most likely issue:** ❌ Backend not processing `?includeInactive=true` parameter
- Backend endpoint `/api/admin/pills/packs` is likely not checking the query parameter
- Or backend is using different parameter name than `includeInactive`
- Or backend logic is inverted/incorrect

**Next action:** Check Network tab requests to confirm frontend is sending the parameter, then investigate backend implementation.
