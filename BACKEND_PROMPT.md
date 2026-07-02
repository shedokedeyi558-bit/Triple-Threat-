# Backend Update Request: Distinguish New vs Returning Players

## Requirement
Update the auth flow to differentiate between new player signup and returning player login.

## Changes Needed

### 1. Update `POST /api/auth/register` endpoint
**Current behavior:** Accepts any phone, returns OTP sent message  
**New behavior:** Check if phone exists in `players` table
- If **NEW player**: Send OTP (current behavior)
- If **RETURNING player**: Return `{ isExisting: true, message: "..." }` without sending OTP

**Response format:**
```json
{
  "success": true,
  "data": {
    "isExisting": false,
    "message": "OTP sent to your phone"
  }
}
// OR for returning player:
{
  "success": true,
  "data": {
    "isExisting": true,
    "message": "Player found. Sending OTP..."
  }
}
```

### 2. Update `POST /api/auth/verify-otp` endpoint
Keep the same — no changes needed. Just verify OTP for both new and returning players.

---

## Logic
- New player: `register()` → sends OTP → `verifyOtp()` → creates player if not exists → returns token
- Returning player: `register()` → detects existing phone → sends OTP anyway → `verifyOtp()` → returns token

Both paths send OTP, but frontend knows whether it's signup or login based on `isExisting` flag.

---

## SQL Check
```sql
SELECT COUNT(*) FROM players WHERE phone = $1
```

Implement this check in your `register` route before sending OTP.

---

## Frontend Impact
Frontend will use the `isExisting` flag to:
- Show "Welcome back!" for returning players
- Show "Create account" for new players
- Both eventually go through the same OTP verification

Let me know once this is done!
