# Toggle Investigation: Real Code Evidence

## The Flow (with real code)

### Step 1: Toggle Button Click
**File:** `app/admin/pills/page.tsx:289-298`

```tsx
<button
  onClick={() => {
    console.log("[DEBUG] Toggle clicked - current showInactive:", showInactive, "-> will become:", !showInactive);
    setShowInactive(!showInactive);  // ← STATE CHANGES HERE
  }}
  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
  style={showInactive ? ... : ...}>
  {showInactive ? "✓" : "○"} Show inactive & sold-out packs
</button>
```

✅ **Status:** onClick handler correctly toggles `showInactive` state

---

### Step 2: State Management  
**File:** `app/admin/pills/page.tsx:157`

```tsx
const [showInactive, setShowInactive] = useState(false);  // ← DEFAULT: false
```

✅ **Status:** State initialized correctly

---

### Step 3: useEffect Dependency (THE KEY)
**File:** `app/admin/pills/page.tsx:159-176`

```tsx
useEffect(() => { 
  (async () => {
    console.log("[DEBUG] useEffect triggered - showInactive changed to:", showInactive);
    setLoading(true);
    try {
      console.log("[DEBUG] About to call getPillPacks with showInactive =", showInactive);
      const res = await adminApi.getPillPacks(showInactive);  // ← PASSES STATE HERE
      console.log("[DEBUG] Response received, packs count:", res.packs?.length);
      setPacks(res.packs as PillPack[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load packs");
    } finally {
      setLoading(false);
    }
  })();
}, [showInactive]);  // ← DEPENDENCY ARRAY: Will run when showInactive changes ✅
```

✅ **Status:** 
- Effect has `showInactive` in dependency array → re-runs when toggle changes
- Effect passes current `showInactive` value to API function
- No caching, no memoization preventing re-fetch

---

### Step 4: API Function Call
**File:** `lib/api.ts:1162-1167`

```tsx
getPillPacks: (includeInactive?: boolean) => {
  const url = `/api/admin/pills/packs${includeInactive ? "?includeInactive=true" : ""}`;
  // ↑ URL CONSTRUCTION LOGIC:
  // if includeInactive === true  → "/api/admin/pills/packs?includeInactive=true"
  // if includeInactive === false → "/api/admin/pills/packs"
  
  console.log("[DEBUG] getPillPacks called with includeInactive:", includeInactive, "URL:", url);
  return request<{ packs: PillPack[] }>(url, { token: getAdminToken() });
},
```

✅ **Status:** URL construction is correct

**Expected URLs:**
| State | `showInactive` value | `includeInactive` parameter | Constructed URL |
|-------|---------------------|-------------------------------|-----------------|
| Default | `false` | `false` | `/api/admin/pills/packs` |
| Toggled ON | `true` | `true` | `/api/admin/pills/packs?includeInactive=true` |
| Toggle OFF | `false` | `false` | `/api/admin/pills/packs` |

---

## Summary: The Chain Works Correctly ✅

```
FRONTEND:
1. Click toggle
2. setShowInactive(!showInactive) executes
3. State changes → useEffect triggers (dependency: [showInactive])
4. adminApi.getPillPacks(showInactive) is called with new value
5. URL is built: /api/admin/pills/packs?includeInactive=true (when ON)
6. fetch() sends request with query parameter
7. Response received and displayed

BACKEND:
X. ... (unknown behavior)
```

---

## What Could Be Wrong

### Issue 1: Backend Ignoring Parameter
**The backend endpoint `/api/admin/pills/packs` might:**
- ❌ Not check the `?includeInactive` query parameter at all
- ❌ Always return only ACTIVE packs regardless of parameter
- ❌ Return the same data both times

**Evidence to look for:**
- Network tab shows two requests (one without param, one with `?includeInactive=true`)
- Both requests return same response body (same pack count)
- Response doesn't change based on parameter

### Issue 2: Backend Using Wrong Parameter Name
**Backend might be looking for:**
- `include_inactive` (snake_case) instead of `includeInactive` (camelCase)
- `show_inactive` instead of `includeInactive`
- `included_inactive` instead of `includeInactive`

**Evidence to look for:**
- Network request URL shows `?includeInactive=true`
- Backend logs show parameter not found/ignored

### Issue 3: Backend Logic Error
**Backend receives parameter but filters incorrectly:**
- Inverted logic: `WHERE status = 'inactive'` when it should be `WHERE status IN ('active', 'inactive')`
- Wrong condition: checking `status !== 'inactive'` even when showing inactive
- Not accounting for "sold-out" status at all

---

## How to Verify

### Using Browser DevTools (RIGHT NOW)

1. Go to Admin → Pills page
2. Open DevTools: Press `F12`
3. Click **Network** tab
4. Filter for `/pills/packs`
5. **Click the toggle button**
6. Watch for requests appearing in Network tab

**Expected:**
- Request 1: `GET /api/admin/pills/packs` — Response shows X packs
- Request 2: `GET /api/admin/pills/packs?includeInactive=true` — Response shows Y packs (Y > X)

**If you see:**
- ✅ Two requests → Frontend is sending both correctly
  - ✅ One with no param, one with `?includeInactive=true` → URL construction correct
  - ❌ Both return same count → **Backend bug**
- ❌ Only one request → Frontend isn't re-triggering
  - But code shows it should be... (unlikely)

---

## Console Output

When you click the toggle, check **DevTools Console** for:

```
[DEBUG] Toggle clicked - current showInactive: false -> will become: true
[DEBUG] useEffect triggered - showInactive changed to: true
[DEBUG] About to call getPillPacks with showInactive = true
[DEBUG] getPillPacks called with includeInactive: true URL: /api/admin/pills/packs?includeInactive=true
[DEBUG] Response received, packs count: [some number]
```

If you see these logs in order → Frontend is working correctly ✅

---

## Real Code Locations (Copy-Paste Ready)

**Toggle Button:**
```
app/admin/pills/page.tsx:289-298
```

**useEffect:**
```
app/admin/pills/page.tsx:159-176
```

**API Function:**
```
lib/api.ts:1162-1167
```

**State Declaration:**
```
app/admin/pills/page.tsx:157
```

---

## Conclusion

✅ **Frontend Implementation:** Correct
- State management working
- Dependencies correct
- URL construction correct
- No caching preventing re-fetch

❌ **Most Likely Issue:** Backend not filtering by `includeInactive` parameter

**Recommended Next Step:**
1. Check Network tab to confirm request is being sent with `?includeInactive=true`
2. Check backend logs to see if parameter is being received
3. Check backend query logic to see if it's filtering correctly
