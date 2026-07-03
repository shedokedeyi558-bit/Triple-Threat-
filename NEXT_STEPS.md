# BitLyfe Rebuild - Next Steps 🚀

## Frontend: DONE ✅
- All pages created and building successfully
- Deployed to GitHub `main` branch
- Vercel auto-deployment in progress

## Backend: TODO

Your backend needs to implement these endpoints:

### 1. PILLS Game

```typescript
// GET /api/pills/available
// Returns list of unopened pills
Response: {
  pills: [
    {
      id: string
      question: string
      category: string
      price: number
      prize: number
      status: "available" | "played" | "expired"
      format: "multiple_choice" | "type_answer"
      options?: string[]  // If MC format
      timer: number        // Seconds
    }
  ]
}

// POST /api/pills/open
// Open a pill, reveal the question
Request: { pillId: string }
Response: {
  question: string
  category: string
  format: "multiple_choice" | "type_answer"
  options?: string[]  // ["A", "B", "C", "D"]
  timer: number
  prize: number
  entryFee: number
}

// POST /api/pills/submit
// Submit answer, get instant result
Request: { pillId: string, answer: string }
Response: {
  won: boolean
  correctAnswer: string
  prize?: number
  newBalance: number
}
```

### 2. TIME MACHINE (Predictions)

```typescript
// GET /api/predictions/active
// Returns list of active predictions with live countdown
Response: {
  predictions: [
    {
      id: string
      question: string
      category: string
      fee: number
      prize_per_winner: number
      slots_filled: number
      max_slots: number
      countdown_end: string  // ISO timestamp
      status: "active" | "locked" | "completed" | "cancelled"
    }
  ]
}

// POST /api/predictions/enter
// Join a prediction
Request: { predictionId: string }
Response: {
  success: boolean
  prediction: { /* same as above */ }
  newBalance: number
}

// POST /api/predictions/submit
// Submit prediction answer
Request: { predictionId: string, answer: string }
Response: {
  success: boolean
  message: string
}

// GET /api/predictions/result/:id
// Get prediction result (after admin marks)
Response: {
  won: boolean
  correctAnswer: string
  prize?: number
  newBalance: number
}
```

### 3. Keep Existing Endpoints (Still Working)

- `POST /api/auth/verify-otp`
- `GET /api/wallet/balance`
- `POST /api/wallet/deposit`
- `GET /api/wallet/verify`
- `GET /api/wallet/transactions`
- `POST /api/wallet/withdraw`

---

## Database Models Needed

### Pill Model
```
id (uuid, primary)
admin_id (uuid, foreign key to admin)
question (text)
category (string) - Football, Food, Lifestyle, etc.
entry_fee (number)
prize (number)
format (enum) - "multiple_choice" or "type_answer"
options (json) - ["A", "B", "C", "D"] if MC
correct_answer (string)
timer_seconds (number)
case_sensitive (boolean) - if type_answer
status (enum) - "available", "played", "expired"
created_at (timestamp)
updated_at (timestamp)
```

### Prediction Model
```
id (uuid, primary)
admin_id (uuid, foreign key to admin)
question (text)
category (string) - Football, Food, Lifestyle, etc.
entry_fee (number)
prize_per_winner (number)
max_participants (number) - e.g., 10
current_participants (number)
countdown_seconds (number) - registration lock duration
countdown_end_time (timestamp)
correct_answer (string | null) - admin sets after countdown
status (enum) - "active", "locked", "completed", "cancelled"
created_at (timestamp)
updated_at (timestamp)
```

### PredictionParticipation Model
```
id (uuid, primary)
prediction_id (uuid, foreign key to Prediction)
player_id (uuid, foreign key to Player)
answer (string)
is_correct (boolean | null) - admin marks after countdown
amount_won (number)
submitted_at (timestamp)
created_at (timestamp)
```

---

## Frontend Expectations

### When Player Opens a Pill
1. User taps pill on grid
2. Confirmation shows cost (e.g., "Cost: ₦500 to open")
3. User confirms → `POST /api/pills/open` with pillId
4. Backend deducts fee from wallet
5. Frontend navigates to `/pills/play/[pillId]`
6. Question displays with timer countdown
7. User answers (MC or text)
8. `POST /api/pills/submit` → instant result

### When Player Enters a Prediction
1. User sees list of predictions with live countdown
2. User taps prediction card
3. User enters prediction answer
4. `POST /api/predictions/submit` → locked state
5. Frontend shows "Prediction locked. Waiting for admin..."
6. After countdown ends or slots fill → registration locked
7. User can poll `GET /api/predictions/result/:id` to check result
8. When admin marks answer → result displays (win/lose + prize)

---

## Testing with Paystack (After Backend Ready)

1. Auth flow:
   ```
   User enters phone: +234 800 123 4567
   OTP: any 6 digits
   → localStorage stores JWT token
   → /play page loads
   ```

2. Pills gameplay:
   ```
   /pills → grid of pills
   Tap pill → confirmation ("Cost ₦500")
   Confirm → question with timer
   Answer → instant result (correct/wrong)
   New balance updates
   ```

3. Predictions gameplay:
   ```
   /time-machine → active predictions list
   Tap prediction → enters with countdown
   Types prediction → locked
   After countdown → admin marks answer
   Result: win/lose + balance updated
   ```

4. Wallet/Deposit:
   ```
   /wallet → balance display
   Tap "Deposit ₦1000"
   → Paystack modal (test API key)
   → Verifies payment
   → Balance updates
   ```

---

## Backend Requirements Checklist

- [ ] Create Pill model + CRUD endpoints
- [ ] Create Prediction model + CRUD endpoints
- [ ] Create PredictionParticipation model
- [ ] Implement `/api/pills/available` - GET unopened pills
- [ ] Implement `/api/pills/open` - POST deduct fee, return question
- [ ] Implement `/api/pills/submit` - POST check answer, update balance
- [ ] Implement `/api/predictions/active` - GET active predictions
- [ ] Implement `/api/predictions/enter` - POST deduct fee, record participation
- [ ] Implement `/api/predictions/submit` - POST record prediction answer
- [ ] Implement `/api/predictions/result/:id` - GET check result
- [ ] Admin endpoint: Create pill (already exists for admin/games?)
- [ ] Admin endpoint: Create prediction (already exists for admin/games?)
- [ ] Admin endpoint: Mark prediction answer as correct
- [ ] Update wallet balance after pill play (instant)
- [ ] Update wallet balance after prediction result (when admin marks)
- [ ] Ensure authentication required (Bearer token in Authorization header)

---

## Deployment Timeline

### Phase 1: Backend Implementation (Your Backend Window)
- Implement all models and endpoints
- Test with Postman/curl
- Verify authentication flow

### Phase 2: Frontend Testing (This Window)
- Verify Vercel deployment (https://bitlyf.vercel.app)
- Test auth flow end-to-end
- Test pills gameplay
- Test predictions gameplay
- Test wallet integration

### Phase 3: Go Live
- Switch Paystack to live keys (in `.env` variables)
- Final smoke test on production backend
- Monitor error rates and performance
- Announce app is live

---

## Quick Links

- **Frontend Code**: https://github.com/shedokedeyi558-bit/Triple-Threat-
- **Frontend Docs**: `BITLYFE_REBUILD_SPEC.md` + `BITLYFE_REBUILD_COMPLETE.md`
- **Vercel Dashboard**: https://vercel.com (check deployment status)
- **Current API Base**: `https://bitlyfe-production.up.railway.app/api`

---

## Questions to Answer Before Going Live

1. **Pill expiration**: Once a pill is answered by any player, should it expire for all, or only for that player?
   - Currently assumed: expires for ALL (pill status = "played")

2. **Prediction results**: Should admin mark all participants' results at once, or individually?
   - Currently assumed: admin marks one answer, all participants with that answer win

3. **Partial matches**: For text predictions, should fuzzy matching be used, or exact match only?
   - Currently assumed: exact match (but can add case_insensitive flag in backend)

4. **Multiple questions per day**: Admin can create multiple pills + predictions per day?
   - Currently assumed: YES, unlimited

5. **Participation refund**: If a player's prediction is marked wrong, is the entry fee refunded?
   - Currently assumed: NO, entry fee is final

---

## Status Summary

| Component | Status | Owner |
|-----------|--------|-------|
| Frontend Pages | ✅ Complete | Frontend |
| Frontend Components | ✅ Complete | Frontend |
| Frontend State (AppContext) | ✅ Complete | Frontend |
| Frontend API Client | ✅ Ready | Frontend |
| Backend Models | ⏳ TODO | Backend |
| Backend Endpoints | ⏳ TODO | Backend |
| Deployment | ⏳ In Progress | Vercel (auto) |
| End-to-End Testing | ⏳ TODO | QA |
| Go Live | ⏳ Pending | You |

---

**Bottom Line**: Frontend is complete and deployed. Backend needs to implement the Pill and Prediction models with their CRUD endpoints. Once backend is ready, we can test end-to-end and launch.
