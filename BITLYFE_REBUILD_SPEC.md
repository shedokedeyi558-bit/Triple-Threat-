# BitLyfe Complete Rebuild - PILLS & TIME MACHINE

## Overview
Replace all "doors" game logic with two new game modes: PILLS (instant) and TIME MACHINE (prediction).

## Game Modes

### 1. PILLS (Instant Feedback Game)
**Flow:**
- Admin creates 5+ anonymous questions in admin panel
- Player sees pill grid (unopened pills only)
- Tap pill → confirmation: "Cost: ₦500 to open. Continue?"
- On confirm → POST /api/pills/open → deduct fee → navigate to play page
- Play page shows:
  - Question text
  - Category badge (small, subtle)
  - Timer bar (green to red, set by admin)
  - If MC format: 4 large buttons (1 per option)
  - If text format: input box + submit button
- Submit → instant result:
  - Win: "Correct ✓ Prize: ₦1,000" + play again / withdraw buttons
  - Lose: "Wrong ✗ Answer: X" + try again button
- Pill marked as "used/expired" - never shows again

**Admin Config:**
- Question text
- Category (Football, Food, Lifestyle, etc.)
- Entry fee
- Prize amount
- Timer duration (in seconds)
- Answer format: "multiple_choice" or "type_answer"
- If MC: provide 4 options + mark correct
- If text: provide correct answer + case sensitivity toggle

### 2. TIME MACHINE (Prediction Game)
**Flow:**
- Admin creates prediction questions with:
  - Question text
  - Category (Football, Food, Lifestyle, etc.)
  - Entry fee
  - Prize per winner
  - Participation limit (e.g., 10 players max)
  - Countdown duration (registration lock timer)
- Player sees question card:
  - Question text
  - Category badge
  - Entry fee
  - Prize
  - Slots filled (e.g., "7/10")
  - Countdown timer (updates real-time)
- Tap "Enter" → deduct fee → navigate to prediction page
- Prediction page shows:
  - Question text
  - Category
  - Prize
  - Countdown (time until lock)
  - Text input: "Type your prediction..."
  - Submit button
- After submit: "Prediction locked. You answered: X"
- After countdown expires OR slots filled: "Waiting for admin to mark results"
- Admin marks correct answer → page refreshes → win/loss result

**Admin Config:**
- Question text
- Category
- Entry fee
- Prize per winner (or total pool?)
- Participation limit
- Countdown duration (registration lock timer)
- Correct answer (set AFTER countdown)

---

## Page Structure

### Public Pages
- `/` - Landing (unauthenticated)
- `/auth` - Phone/OTP login
- `/terms` - Terms of Service

### Authenticated Pages
- `/play` - Game selection (Pills / Time Machine)
- `/pills` - Pill grid (unopened only)
- `/pills/play/[pillId]` - Question + answer + result
- `/time-machine` - Active predictions list
- `/predictions/play/[predictionId]` - Prediction entry page
- `/wallet` - Balance, deposit, withdraw, history
- `/profile` - Phone, logout

### Admin Pages (Keep as-is)
- `/admin` - Dashboard
- `/admin/games/create` - Create games
- `/admin/games` - List/manage games
- All admin sub-pages

---

## API Endpoints (Backend Needed)

### PILLS
```
GET /api/pills/available
  Returns: { pills: [ { id, category, price, status } ] }

POST /api/pills/open
  Body: { pillId }
  Returns: { question, format, options, timer, prize, entryFee }

POST /api/pills/submit
  Body: { pillId, answer }
  Returns: { won, correctAnswer, prize, newBalance }
```

### TIME MACHINE
```
GET /api/predictions/active
  Returns: { predictions: [ { id, question, category, fee, prize, slots_filled, max_slots, countdown_end } ] }

POST /api/predictions/enter
  Body: { predictionId }
  Returns: { success, prediction }

POST /api/predictions/submit
  Body: { predictionId, answer }
  Returns: { success }

GET /api/predictions/result/:id
  Returns: { won, correctAnswer, prize, newBalance }
```

### EXISTING (Keep)
```
GET /api/wallet/balance
GET /api/wallet/deposit
GET /api/wallet/transactions
POST /api/wallet/withdraw
GET /api/game/stats (for landing page)
```

---

## Data Models (Backend)

### Pill
```
{
  id: string (uuid)
  admin_id: string
  question: string
  category: string
  entry_fee: number
  prize: number
  format: "multiple_choice" | "type_answer"
  options: [ "A", "B", "C", "D" ] (if MC)
  correct_answer: string
  timer_seconds: number
  case_sensitive: boolean (if text)
  status: "available" | "played" | "expired"
  created_at: timestamp
}
```

### Prediction
```
{
  id: string (uuid)
  admin_id: string
  question: string
  category: string
  entry_fee: number
  prize_per_winner: number (or total pool?)
  max_participants: number
  current_participants: number
  countdown_seconds: number (registration lock)
  countdown_end_time: timestamp
  correct_answer: string | null (set by admin after countdown)
  status: "active" | "locked" | "completed" | "cancelled"
  created_at: timestamp
}
```

### PredictionParticipation
```
{
  id: string (uuid)
  prediction_id: string
  player_id: string
  answer: string
  is_correct: boolean | null
  amount_won: number
  submitted_at: timestamp
}
```

---

## Frontend Components

### New Components
- `PillGrid` - Grid of unopened pills
- `PillConfirmation` - Bottom sheet: cost + confirm
- `PillPlay` - Question + timer + MC or text answer
- `PillResult` - Win/lose screen
- `PredictionCard` - Card for active prediction
- `PredictionList` - List of active predictions
- `PredictionPlay` - Question + text input + countdown
- `PredictionLocked` - "Waiting for admin" message
- `PredictionResult` - Win/lose screen

### Updated Components
- `BottomNavigation` - Keep (Play, Wallet, Profile)
- `AppContext` - Add pill/prediction state
- `api.ts` - Add new endpoints

### Pages to Delete
- `/app/doors/*`
- `/app/format/*`
- `/app/challenges/*`

### Pages to Create/Update
- `/app/page.tsx` - Landing (2 cards: Pills, Time Machine)
- `/app/play/page.tsx` - Game selection (Pills, Time Machine)
- `/app/pills/page.tsx` - Pill grid
- `/app/pills/play/[pillId]/page.tsx` - Pill play + result
- `/app/time-machine/page.tsx` - Prediction list
- `/app/predictions/play/[predictionId]/page.tsx` - Prediction entry + result

---

## Design System

### Colors
- Background: #0A0A0A
- Cards: #1A1A1A
- Borders: #2A2A2A
- Primary: #00FF66 (neon green)
- Error: #FF4444
- Text: white, gray (#888)

### Spacing
- Tap targets: min 48px height
- Border radius: min 12px on cards
- Padding: 16px standard

### Animations
- Transitions: 0.2s-0.3s
- Framer Motion: subtle fade/scale
- No confetti, no emojis

### Typography
- Font: system stack
- Headings: font-bold, uppercase, tracking-tight
- Body: regular

---

## Implementation Steps

1. **Backend Setup** (Your backend window)
   - Create Pill model + endpoints
   - Create Prediction model + endpoints
   - Create PredictionParticipation model
   - Update admin endpoints

2. **Frontend - Delete Old**
   - Remove `/doors`, `/format`, `/challenges` directories

3. **Frontend - Update Core**
   - Update `AppContext` for pills/predictions
   - Update `api.ts` with new endpoints
   - Update `app/page.tsx` (landing)
   - Update `app/play/page.tsx` (game selection)

4. **Frontend - Create PILLS**
   - `/app/pills/page.tsx` (grid)
   - `/app/pills/play/[pillId]/page.tsx` (play + result)
   - Components: `PillGrid`, `PillConfirmation`, `PillPlay`, `PillResult`

5. **Frontend - Create TIME MACHINE**
   - `/app/time-machine/page.tsx` (list)
   - `/app/predictions/play/[predictionId]/page.tsx` (entry + result)
   - Components: `PredictionCard`, `PredictionList`, `PredictionPlay`, `PredictionResult`

6. **Testing**
   - Auth flow
   - Pills: pick → confirm → play → result
   - Time Machine: list → enter → predict → lock → result
   - Wallet integration
   - Bottom nav

7. **Deploy**
   - Push to GitHub
   - Vercel auto-deploy

---

## Notes
- No mock data - all from API
- Clean Lucide icons only
- Dark theme, fintech aesthetic
- Real-time countdown timers (use setInterval)
- Error handling for insufficient balance
- Redirect to /auth if not authenticated
