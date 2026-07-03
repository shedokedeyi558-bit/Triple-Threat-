# BitLyfe Architecture - PILLS & TIME MACHINE

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER FLOWS                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────────┐             │
│  │  Landing     │         │   Authenticated  │             │
│  │  (/)         │─────→   │   (/play)        │             │
│  │              │         │                  │             │
│  │ Pills Card   │         │ Pills    →  Grid │             │
│  │ Time Machine │         │ Time Machine → List│           │
│  └──────────────┘         └──────────────────┘             │
│         ▲                                                    │
│         │                                                    │
│    Not Logged In                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Application Routes

### Public (No Auth Required)
```
/                 → Landing page (game mode cards)
/auth             → Phone/OTP login
/terms            → Terms of Service
```

### Protected (Auth Required)
```
/play             → Game selection (Pills vs Time Machine)
/pills            → Pill grid display
/pills/play/[id]  → Pill question + answer + result
/time-machine     → Predictions list
/predictions/play/[id] → Prediction entry + result
/wallet           → Balance, deposit, withdraw
/profile          → Phone, logout
```

### Admin (Auth + Admin Role)
```
/admin            → Dashboard
/admin/games      → Create/manage games
/admin/players    → Manage players
/admin/settings   → Settings
```

---

## Game Flows

### PILLS Game (Instant Feedback)

```
START
  ↓
/pills (show grid)
  ↓
USER TAPS PILL
  ↓
Show confirmation: "Cost ₦X to open?"
  ↓
[NO] → stay on grid
[YES]
  ↓
POST /api/pills/open
  ↓
Deduct entry fee from wallet
  ↓
Navigate to /pills/play/[pillId]
  ↓
Display question + timer + answer format
  ↓
[Timer animates: green → red]
  ↓
USER ANSWERS (MC or text)
  ↓
POST /api/pills/submit
  ↓
┌─────────────────┬──────────────────┐
│   CORRECT ✓     │   WRONG ✗        │
│ "You win!"      │ "Answer: X"      │
│ "₦[prize]"      │ "Try again?"     │
│ [Play again] ⟷  │ [Play again] ⟷   │
│ [Withdraw]      │ [Withdraw]       │
└─────────────────┴──────────────────┘
  ↓
PILL MARKED AS "played/expired"
  ↓
END
```

### TIME MACHINE Game (Prediction)

```
START
  ↓
/time-machine (show predictions list)
  ↓
Each card shows:
├─ Question text
├─ Category badge
├─ Entry fee, Prize
├─ Slots filled (e.g., 7/10)
└─ Live countdown timer
  ↓
USER TAPS PREDICTION CARD
  ↓
POST /api/predictions/enter
  ↓
Deduct entry fee from wallet
  ↓
Navigate to /predictions/play/[predictionId]
  ↓
Display question + countdown (registration lock timer)
  ↓
[Countdown animates in real-time]
  ↓
USER TYPES PREDICTION
  ↓
USER TAPS SUBMIT
  ↓
POST /api/predictions/submit
  ↓
Display: "Prediction locked. You answered: X"
  ↓
[Countdown continues or fills up]
  ↓
REGISTRATION LOCK HAPPENS
(no new entries allowed)
  ↓
ADMIN MARKS CORRECT ANSWER
  ↓
Frontend polls GET /api/predictions/result/[id]
  ↓
┌──────────────────────┬──────────────────────┐
│   USER CORRECT ✓     │   USER WRONG ✗       │
│ "You predicted right!"│ "Wrong answer"       │
│ "₦[prize] won"       │ "Correct: X"         │
│ "Balance updated"    │ "Better luck next!"  │
└──────────────────────┴──────────────────────┘
  ↓
BALANCE UPDATED
  ↓
END
```

---

## State Management (AppContext)

```typescript
AppState = {
  // Auth
  isAuthenticated: boolean
  player: {
    id, phone, name, balance, is_admin
  }
  
  // Pills
  pills: {
    selectedPill: Pill | null
    pills: Pill[]
    pillsLoading: boolean
  }
  
  // Predictions
  activePrediction: Prediction | null
  predictions: Prediction[]
  predictionsLoading: boolean
  userPredictionAnswer?: string
  
  // Legacy (doors) - kept for backward compat
  selectedDoor, doors, etc.
}

Actions = {
  LOGIN, LOGOUT, UPDATE_BALANCE
  SET_PILLS, SELECT_PILL, PILLS_LOADING
  SET_PREDICTIONS, SELECT_PREDICTION, SET_PREDICTION_ANSWER
}
```

---

## API Layers

### Frontend Fetch Layer (lib/api.ts)

```
pillsApi
├─ getAvailable()        → GET /api/pills/available
├─ open(pillId)          → POST /api/pills/open
└─ submit(pillId, answer) → POST /api/pills/submit

predictionsApi
├─ getActive()           → GET /api/predictions/active
├─ enter(predictionId)   → POST /api/predictions/enter
├─ submit(id, answer)    → POST /api/predictions/submit
└─ getResult(id)         → GET /api/predictions/result/:id

walletApi (existing)
├─ getBalance()
├─ deposit()
├─ verifyDeposit()
├─ getTransactions()
└─ withdraw()

authApi (existing)
├─ register(phone)
└─ verifyOtp(phone, otp)
```

### Backend API Layer (Expected)

```
/api/pills
├─ GET /available        ← Unopened pills
├─ POST /open            ← Reveal question
└─ POST /submit          ← Submit answer → instant result

/api/predictions
├─ GET /active           ← Active predictions
├─ POST /enter           ← Join prediction
├─ POST /submit          ← Submit prediction answer
└─ GET /result/:id       ← Check result (after admin marks)

/api/wallet (existing)
/api/auth (existing)
```

---

## Component Tree

```
RootLayout
├─ AppProvider
│   ├─ Page (landing | auth | play | etc)
│   │  ├─ Header
│   │  ├─ Content
│   │  │  ├─ PillGrid (with PillConfirmation)
│   │  │  ├─ PillPlay (with Timer)
│   │  │  ├─ PillResult
│   │  │  ├─ PredictionCard (with countdown)
│   │  │  ├─ PredictionPlay (with countdown)
│   │  │  ├─ PredictionLocked
│   │  │  └─ PredictionResult
│   │  └─ Footer
│   └─ BottomNavigation
│       ├─ Play icon
│       ├─ Wallet icon
│       └─ Profile icon
```

---

## Data Models

### Pill
```json
{
  "id": "uuid",
  "question": "What is 2+2?",
  "category": "Math",
  "price": 500,
  "prize": 1000,
  "status": "available|played|expired",
  "format": "multiple_choice|type_answer",
  "options": ["3", "4", "5", "6"],
  "timer": 30,
  "correct_answer": "4"
}
```

### Prediction
```json
{
  "id": "uuid",
  "question": "How many goals will Chelsea score Saturday?",
  "category": "Football",
  "fee": 500,
  "prize_per_winner": 5000,
  "slots_filled": 7,
  "max_slots": 10,
  "countdown_end": "2026-08-22T18:00:00Z",
  "status": "active|locked|completed",
  "correct_answer": null  // Set by admin after countdown
}
```

### PredictionParticipation
```json
{
  "id": "uuid",
  "prediction_id": "uuid",
  "player_id": "uuid",
  "answer": "2",
  "is_correct": null,  // Set by admin after countdown
  "amount_won": 0,
  "submitted_at": "2026-08-22T17:55:00Z"
}
```

---

## Real-Time Features

### Countdown Timers
```
Pill Timer (during play):
├─ Duration: set by admin (e.g., 30s)
├─ Starts: when question revealed
├─ Stops: on answer submit OR timeout
├─ Display: animated progress bar (green → red)
└─ Auto-submit: empty answer on timeout

Prediction Countdown (registration lock):
├─ Duration: set by admin (e.g., 1 hour)
├─ Starts: when prediction created
├─ Stops: when countdown expires OR max slots reached
├─ Display: "HH:MM:SS" with real-time updates
└─ Effect: locks new entries when timer hits 0
```

### Live Updates
```
Predictions List:
├─ Refetch every 5 seconds (or use WebSocket)
├─ Update countdown timers in real-time
├─ Show "Slots filled" current count
└─ Disable entries if slots full

Prediction Result:
├─ Poll GET /api/predictions/result/:id every 5s
├─ Display: "Waiting for admin..."
├─ When result available: show win/lose
└─ Auto-update balance
```

---

## Design Token Reference

```css
/* Colors */
--color-bg: #0A0A0A
--color-card: #1A1A1A
--color-border: #2A2A2A
--color-primary: #00FF66
--color-error: #FF4444
--color-text-primary: white
--color-text-secondary: #888

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Sizing */
--tap-target-min: 48px
--border-radius-sm: 8px
--border-radius-md: 12px
--border-radius-lg: 16px

/* Typography */
--font-heading: bold, uppercase, tracking-tight
--font-body: regular
--font-size-heading: 24-32px
--font-size-body: 14-16px

/* Animation */
--duration-fast: 200ms
--duration-normal: 300ms
--easing: ease-out
```

---

## Performance Considerations

### Code Splitting
- Each game page is a separate route → automatic Next.js splitting
- Lazy load heavy components (charts, modals)
- Only load admin components if user.is_admin

### Data Fetching
- Pills: fetch on `/pills` mount → cache in state
- Predictions: fetch on mount + refetch every 5s (optional WebSocket)
- Balance: fetch once on auth, update after actions

### Animations
- Framer Motion: minimal, 0.2-0.3s transitions
- No confetti or excessive effects
- CSS transitions for hover states

### Mobile Optimization
- Mobile-first CSS (360px baseline)
- Min tap targets: 48px × 48px
- Viewport: no zoom (user-scalable=false)

---

## Security Considerations

- **Auth**: Bearer token in Authorization header
- **Token storage**: localStorage (JWT)
- **HTTPS only**: All API calls via HTTPS
- **CORS**: Backend must allow frontend origin
- **Sensitive data**: No hardcoding secrets (use env vars)
- **Input validation**: Frontend validates, backend validates again

---

## Error Handling

```
User Flows:
├─ Insufficient balance → show "Top up?" button
├─ Network error → show "Try again" button
├─ API error → show user-friendly message
├─ Auth expired → redirect to /auth
├─ Missing pill/prediction → show "Not found"
└─ Timeout → show "Request timed out"

Backend Errors:
├─ 401 Unauthorized → no/invalid token
├─ 402 Insufficient balance → show deposit prompt
├─ 404 Not found → pill/prediction doesn't exist
├─ 409 Conflict → already answered / slots full
└─ 500 Server error → "Try again later"
```

---

## Testing Scenarios

### Scenario 1: Successful Pill Gameplay
1. Login with phone/OTP
2. Navigate to /pills
3. Tap pill
4. Confirm cost
5. Answer question (MC or text)
6. See result (win or lose)
7. Balance updates
8. Pill no longer available

### Scenario 2: Successful Prediction Gameplay
1. Login with phone/OTP
2. Navigate to /time-machine
3. See predictions with countdowns
4. Tap prediction
5. Type prediction answer
6. Submit → prediction locked
7. Wait for admin to mark answer
8. See result (win or lose)
9. Balance updates

### Scenario 3: Insufficient Balance
1. User has ₦200 balance
2. Pill costs ₦500
3. Tap pill → "Insufficient balance. Top up?"
4. Tap "Top up" → navigate to /wallet
5. Deposit ₦500 via Paystack
6. Return to /pills
7. Tap pill again → works

### Scenario 4: Prediction Countdown Lock
1. Prediction has 5 minutes countdown
2. User enters prediction (answer locked)
3. Wait 5 minutes
4. Countdown reaches 0
5. Registration locked (new entries blocked)
6. Admin marks correct answer
7. Results display

---

## Deployment Architecture

```
GitHub (main branch)
    ↓
    ↓ (webhook)
    ↓
Vercel (auto-deploy)
    ↓
    ├─ Frontend: https://bitlyf.vercel.app
    │
    └─ API calls to:
        Backend: https://bitlyfe-production.up.railway.app

Frontend (.env.local):
├─ NEXT_PUBLIC_API_URL=https://bitlyfe-production.up.railway.app
└─ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

Backend (.env):
├─ DATABASE_URL=...
├─ PAYSTACK_SECRET_KEY=...
└─ JWT_SECRET=...
```

---

## Summary

BitLyfe architecture consists of:

1. **Frontend** (Next.js 14, React, TypeScript, Tailwind)
   - 7 main pages (landing, auth, play, pills, time-machine, wallet, profile)
   - 10+ UI components (grids, cards, timers, forms)
   - Centralized state (AppContext)
   - API client layer (lib/api.ts)
   - Dark fintech theme

2. **Backend** (To implement)
   - Pill model + endpoints
   - Prediction model + endpoints
   - PredictionParticipation model
   - Wallet integration
   - Admin endpoints for creation

3. **Deployment**
   - Frontend: Vercel (auto-deploy from GitHub)
   - Backend: Railway
   - Database: (Your choice)
   - Payment: Paystack

The architecture supports instant feedback (Pills) and prediction-based (Time Machine) gameplay with real-time countdowns, instant results, balance updates, and admin controls.
