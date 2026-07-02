# Integration Checklist: Auth Flow Complete

## ✅ Backend Implementation
- [x] Phone existence check in `register()` endpoint
- [x] Return `isExisting: true/false` flag
- [x] Create account + apply welcome bonus for new players
- [x] Send OTP to both new and returning players
- [x] Verify OTP endpoint unchanged (works for both flows)

---

## ✅ Frontend Implementation
- [x] Auth page captures `isExisting` flag from backend
- [x] Show "Create account" for new players
- [x] Show "Welcome back!" for returning players
- [x] Unified OTP verification step
- [x] Logout button on homepage
- [x] Logout clears token + player state + localStorage
- [x] Profile menu with wallet link and logout option

---

## ✅ State Management
- [x] AppContext properly tracks `isAuthenticated` status
- [x] Login persists player info to localStorage
- [x] Logout clears all auth state
- [x] Rehydration on page reload works

---

## 🧪 Manual Testing Scenarios

### Scenario 1: New Player - Complete Flow
```
1. Go to http://localhost:3000
2. Click "Play Now"
3. Enter new phone: 08055555555
4. Click "Send OTP"
   ✅ See "Create account" heading
   ✅ Backend creates player with welcome bonus
5. Enter OTP: 123456
6. Redirects to /format
7. Homepage shows balance = welcome bonus (₦500)
```

### Scenario 2: Returning Player - Login Again
```
1. Logged out, on homepage
2. Click "Play Now"
3. Enter same phone: 08055555555 (from Scenario 1)
4. Click "Send OTP"
   ✅ See "Welcome back!" heading
   ✅ NO new account created
5. Enter OTP: 123456
6. Redirects to /format
7. Balance remains unchanged (no second bonus)
```

### Scenario 3: Logout & Switch Account
```
1. Logged in as 08055555555
2. Click profile (top-right)
3. Click "Logout"
   ✅ Redirects to homepage
   ✅ Profile menu disappears
   ✅ "Play Now" links to /auth
4. Click "Play Now"
5. Enter different phone: 08077777777
6. Click "Send OTP"
   ✅ See "Create account" heading (new account)
7. Enter OTP: 123456
8. Logged in as new player with welcome bonus
```

### Scenario 4: localStorage Persistence
```
1. Logged in as 08055555555
2. Open DevTools: F12 → Application → Local Storage
3. Should see:
   - tt_token: "eyJ..."
   - tt_player: "{\"id\":\"...\", \"phone\":\"0805...\"}"
4. Refresh page (F5)
   ✅ Still logged in
   ✅ Profile menu visible
   ✅ Balance shows
5. Click Logout
   ✅ Both localStorage keys cleared
6. Refresh page
   ✅ Not logged in
   ✅ "Play Now" links to /auth
```

### Scenario 5: Invalid OTP
```
1. Enter phone: any number
2. Click "Send OTP"
3. Enter incorrect OTP: 000000
4. Click "Verify & Continue"
   ✅ See error: "Verification failed..."
   ✅ Stay on OTP screen
   ✅ Can click "Change number" to retry
```

---

## 🔍 Browser Console Checks

### After Login
```javascript
// In console:
localStorage.getItem('tt_token') // Should return JWT token
localStorage.getItem('tt_player') // Should return player object
JSON.parse(localStorage.getItem('tt_player')) // Parse to see details
```

### After Logout
```javascript
// In console:
localStorage.getItem('tt_token') // Should return null
localStorage.getItem('tt_player') // Should return null
```

---

## 📊 API Response Verification

### New Player Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"08055555555","name":"Test User"}'
```

Expected:
```json
{
  "success": true,
  "data": {
    "message": "Account created! OTP sent to your phone.",
    "isExisting": false
  }
}
```

### Returning Player Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"08055555555"}'
```

Expected:
```json
{
  "success": true,
  "data": {
    "message": "Player found. Sending OTP...",
    "isExisting": true
  }
}
```

### Verify OTP (Same for Both)
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"08055555555","otp":"123456"}'
```

Expected:
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "player": {
      "id": "uuid",
      "phone": "08055555555",
      "name": "Test User",
      "balance": 500
    }
  }
}
```

---

## 🚀 Deployment Readiness

- [ ] Run full manual test suite (all 5 scenarios above)
- [ ] Verify no console errors in browser DevTools
- [ ] Check mobile responsiveness (auth pages)
- [ ] Test on actual backend URL (not localhost)
- [ ] Verify Paystack integration (optional for MVP)
- [ ] Test admin panel unaffected (email: admin@triplethreat.com)
- [ ] Load test with multiple concurrent players
- [ ] Verify database has correct player records
- [ ] Check welcome bonus applied correctly
- [ ] Review error messages for clarity

---

## 📝 Known Test Credentials

| Scenario | Phone | OTP | Result |
|----------|-------|-----|--------|
| New signup | `08055555555` | Any 6 digits | Creates account, shows bonus |
| Returning | `08055555555` | Any 6 digits | Logs in, no duplicate bonus |
| Another new | `08077777777` | Any 6 digits | Creates new account, separate balance |
| Admin | Email: `admin@triplethreat.com` | Password: `admin123` | Admin login unaffected |

---

## 🐛 Troubleshooting

### Issue: Stuck on OTP screen
**Solution:** 
- Check browser console for errors (F12)
- Verify backend is running on port 5000
- Check NEXT_PUBLIC_API_URL in .env.local

### Issue: Balance not showing after login
**Solution:**
- Check localStorage for `tt_player` key
- Verify player balance in database
- Confirm welcome bonus was applied

### Issue: Logout not working
**Solution:**
- Check `removeToken()` is being called
- Verify localStorage cleared (DevTools → Storage)
- Ensure AppContext LOGOUT action fired

### Issue: "Welcome back!" not showing for returning player
**Solution:**
- Verify phone exists in database
- Check backend returns `isExisting: true`
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito window

---

## ✨ Success Criteria

✅ New players see "Create account" message  
✅ Returning players see "Welcome back!" message  
✅ Both flows successfully verify OTP  
✅ Welcome bonus applied only to new players  
✅ Logout clears all auth state completely  
✅ Can switch between multiple accounts  
✅ localStorage persists login across page reloads  
✅ No console errors or warnings  
✅ Admin panel still works independently  

---

**Status:** Ready for full integration testing. All components are in place and synced between frontend and backend.

