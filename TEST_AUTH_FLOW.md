# Auth Flow Testing Guide

## Quick Test Steps

### Test 1: New Player Signup
1. Go to http://localhost:3000/auth
2. Enter phone: `08055555555` (or any new phone)
3. Click "Send OTP"
   - ✅ Should see: **"Create account"** heading
   - ✅ Should see: "Enter the 6-digit code sent to 0805***5555"
4. Enter any 6-digit OTP: `123456`
5. Should redirect to `/format` and be logged in
6. Homepage should show:
   - Your balance (with new user bonus)
   - Profile menu (top-right)

### Test 2: Returning Player Login
1. Go to http://localhost:3000
2. Click your profile → Logout (or manually clear localStorage)
3. Click "Play Now" → Go to /auth
4. Enter phone: `08055555555` (the one from Test 1)
5. Click "Send OTP"
   - ✅ Should see: **"Welcome back!"** heading
   - ✅ Should see: "Enter the verification code sent to 0805***5555"
6. Enter any 6-digit OTP: `123456`
7. Should redirect to `/format` and be logged in

### Test 3: Logout Button
1. Go to http://localhost:3000 (logged in)
2. Click your profile in top-right corner
3. Click "Logout"
   - ✅ Should redirect to homepage
   - ✅ "Play Now" button should link to `/auth`
   - ✅ Balance section should be gone
   - ✅ localStorage should be cleared

---

## Expected Responses

### New Player
```json
{
  "success": true,
  "data": {
    "message": "Account created! OTP sent to your phone.",
    "isExisting": false
  }
}
```

### Returning Player
```json
{
  "success": true,
  "data": {
    "message": "Player found. Sending OTP...",
    "isExisting": true
  }
}
```

---

## Browser DevTools Tips
1. Open DevTools: F12
2. Go to Application → Local Storage
3. Look for `tt_token` and `tt_player` keys
4. After logout, both should be cleared

---

## Known Test Credentials
- **New player phone:** 08055555555
- **OTP:** Any 6 digits (e.g., 123456)
- **Existing player phone:** 08098765432 (if already created)

