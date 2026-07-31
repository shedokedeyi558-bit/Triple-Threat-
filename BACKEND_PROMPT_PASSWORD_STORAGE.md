# Backend Task: Store Password Hash on OTP Verification

## Context
Users are signing up with password, but the password isn't being persisted when they verify OTP. This breaks the signin flow because:
- Users sign up (Phone → Password → OTP)
- Backend receives password in `/api/auth/verify-otp` but doesn't hash/store it
- When users later sign in with `/api/auth/phone-signin`, there's no `password_hash` to compare, so they get "Incorrect password"

## What to Change

### Endpoint: `POST /api/auth/verify-otp`
- **Current behavior**: Accepts `{ phone, otp, password? }` but ignores the password
- **New behavior**: 
  - Accept optional `password` field in request body
  - If `password` is provided:
    - Hash it with bcrypt (same algorithm as signup)
    - Save it to the `password_hash` field on the player record
    - Ensure this happens **before** OTP verification completes
  - If no password provided, proceed as normal (backward compatible)

## Expected Request Body
```json
{
  "phone": "+2348012345678",
  "otp": "123456",
  "password": "userpassword"
}
```

## Expected Response (unchanged)
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "player": {
      "id": "player-id",
      "phone": "+2348012345678",
      "name": null,
      "balance": 0
    }
  }
}
```

## Implementation Notes
- Password field is **optional** in the request (some flows may not include it)
- Use the same bcrypt logic/salt rounds as the existing `POST /api/auth/signup` implementation
- Player record should have a `password_hash` field that can be `null` (for legacy OTP-only users)
- No changes needed to response format — just store the hash in the DB

## Testing
After implementation, the following should work end-to-end:
1. User calls `POST /api/auth/register` with phone → receives OTP
2. User calls `POST /api/auth/verify-otp` with phone, OTP, **and password** → password is hashed and stored
3. User later calls `POST /api/auth/phone-signin` with phone and password → authentication succeeds

## Files to Update
- `index.js` or auth routes file (wherever `POST /api/auth/verify-otp` handler is)
- Database schema (if `password_hash` field doesn't exist on player record)
