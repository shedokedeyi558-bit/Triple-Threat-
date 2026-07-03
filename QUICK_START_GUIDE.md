# 🚀 Quick Start Guide - Triple Threat

## ✅ Status: Ready to Test

The application is fully built and ready to run. All authentication, admin dashboard, and game management features are implemented and working.

---

## 🎮 Testing Credentials

### Admin Account
- **Email:** `admin@triplethreat.com`
- **Password:** `admin123`
- **Access:** Admin dashboard at `/admin`

### Test Player Account
- **Email:** `test@example.com`
- **Password:** `password123`
- **Access:** Player dashboard and games

### New Player Signup
- Create an account with any new email
- Must include: email, password (6+ chars), phone number
- New players start with ₦0 balance (mock data)

---

## 🏃 How to Run

### 1. Start Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 2. Build for Production
```bash
npm run build
npm start
```

---

## 🗂️ Key Files

### Frontend Pages
- **`/`** - Home page with feature showcase
- `/auth` - Sign In / Sign Up with email & password
- `/format` - Game format selection
- `/doors` - 3-door games (player view)
- `/challenges` - Daily challenges (player view)
- `/admin` - Admin dashboard
- `/admin/games` - Games management list
- `/admin/games/create` - 4-step game creation wizard
- `/admin/games/[id]` - Game detail and management

### API Endpoints (Mock)
- `POST /api/auth/signup` - Create new player account
- `POST /api/auth/signin` - Sign in with email & password
- `POST /api/auth/admin-login` - Admin login (legacy)
- `GET /api/admin/games` - List games
- `POST /api/admin/games/create` - Create new game
- `GET /api/admin/games/:id` - Get game details
- `POST /api/admin/games/:id/activate` - Activate game
- `POST /api/admin/games/:id/reveal-answer` - Reveal challenge answer
- And many more...

### Key Components
- **AppContext** (`context/AppContext.tsx`) - Player authentication state
- **AdminContext** (`context/AdminContext.tsx`) - Admin state management
- **API Client** (`lib/api.ts`) - All API calls in one place
- **Mocked Data** (`lib/mockData.ts`) - Sample data for UI testing

---

## 🧪 What to Test

### Player Flow
1. Go to `/auth`
2. Click **Sign Up**
3. Enter: email, name (optional), phone, password
4. Click **Create Account**
5. Should redirect to `/format` (player games page)

### Admin Flow
1. Go to `/auth`
2. Sign In with `admin@triplethreat.com` / `admin123`
3. Should redirect to `/admin` (admin dashboard)
4. Navigate to:
   - **Games** - Manage all games
   - **Create Game** - Create a new door or challenge game
   - **Game Detail** - View participants and manage specific game

### Game Creation Wizard
1. Go to `/admin/games/create`
2. **Step 1:** Choose game type (Door or Challenge)
3. **Step 2:** Configure game details
4. **Step 3:** Set questions (for door games only)
   - Door 1: Easy question
   - Door 2: Medium question
   - Door 3: Hard question
5. **Step 4:** Review and create
6. Game appears in games list

### Game Management
1. Go to `/admin/games`
2. Click on a game to view details
3. If game is `draft`, click **Activate**
4. If game is `active`:
   - Click **Pause** or **End Game**
   - For challenges: Click **Reveal Answer** when done
5. View participants and their answers

---

## 📊 Admin Dashboard Features

### Dashboard Home (`/admin`)
- **Metrics cards**: Today's plays, revenue, payouts, profit
- **Game overview**: Door games vs Challenge games stats
- **Pending challenges**: Challenges awaiting answer reveal

### Games Management (`/admin/games`)
- **Filter by type**: Door games, Challenge games
- **Filter by status**: Draft, Active, Paused, Ended
- **Quick actions**: Activate, Pause, End, View Details
- **Create new game**: Click "+ Create Game" button

### Game Detail (`/admin/games/[id]`)
- **Game info**: Type, status, entry fee/stake, participants
- **Actions**: Activate, Pause, Resume, End
- **Participants table**: Phone, answer, correctness, prize
- **Reveal answer** (challenges): Enter correct answer and submit
- **Statistics**: Total players, revenue, payout calculation

### Game Creation (`/admin/games/create`)
- **4-step wizard** for complete game setup
- **Door games**: Manually set 3 questions with options
- **Challenge games**: Set category, stake, max participants
- **Question editor**: Multiple choice or type answer format
- **Difficulty levels**: Easy, Medium, Hard with prize amounts

---

## 🔧 Backend Implementation Checklist

When connecting to real backend, implement:

### Priority 1 (Core)
- [ ] Database schema for games, participations, transactions
- [ ] Auth endpoints with bcrypt password hashing
- [ ] `POST /api/admin/games/create` - Persist game to DB
- [ ] `GET /api/admin/games` - Query games with filtering
- [ ] `POST /api/admin/games/:id/activate` - Update status
- [ ] `POST /api/admin/games/:id/reveal-answer` - Winner calculation

### Priority 2 (Management)
- [ ] Pause/Resume/End game endpoints
- [ ] Get game participants with filtering
- [ ] Update game endpoint
- [ ] Delete game endpoint

### Priority 3 (Analytics)
- [ ] Game statistics calculations
- [ ] Revenue analytics
- [ ] Participant list with answers

### Database Tables
```sql
-- games table
CREATE TABLE games (
  id UUID PRIMARY KEY,
  game_type ENUM('door_game', 'challenge_game'),
  title VARCHAR,
  description TEXT,
  status ENUM('draft', 'active', 'paused', 'ended', 'locked', 'closed'),
  entry_fee INTEGER,
  stake_amount INTEGER,
  prize_pool INTEGER,
  max_participants INTEGER,
  current_participants INTEGER,
  countdown_duration INTEGER,
  created_at TIMESTAMP,
  created_by UUID,
  -- Store questions as JSON for door games
  doors JSON
);

-- game_participations table
CREATE TABLE game_participations (
  id UUID PRIMARY KEY,
  game_id UUID FOREIGN KEY,
  player_id UUID FOREIGN KEY,
  answer TEXT,
  is_correct BOOLEAN,
  amount_won INTEGER,
  participated_at TIMESTAMP
);
```

---

## 🚨 Common Issues & Solutions

### Build Failed
- Run `npm run build` to check TypeScript errors
- All errors should show in terminal with line numbers

### Dev Server Won't Start
- Check port 3000 isn't in use: `netstat -ano | findstr :3000`
- Try `npm run dev` again or use different port: `npm run dev -- -p 3001`

### Styling Issues
- Run `npm run build` to ensure Tailwind is compiled
- Check `.next` folder isn't corrupted, delete if needed

### API Calls Failing
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Mock endpoints use Next.js routes by default (no external backend needed)

---

## 📱 Responsive Design

The app is fully responsive:
- **Mobile**: All features work on phones
- **Tablet**: Optimized for iPad and tablet devices
- **Desktop**: Full-featured experience on large screens

Test on different screen sizes to verify layout works correctly.

---

## 🎯 Next Steps

1. **Test the flows** - Use the test credentials to explore
2. **Check performance** - Open DevTools (F12) and check Network tab
3. **Review code** - All components are well-documented
4. **Plan backend** - Refer to the implementation checklist above
5. **Connect backend** - Replace mock API calls with real endpoints

---

## 📞 Support

For more detailed documentation, see:
- `ADMIN_DASHBOARD_COMPLETE.md` - Complete admin dashboard spec
- `AUTH_SYSTEM_UNIFIED.md` - Auth system architecture
- `CHALLENGES_BACKEND_REQUIREMENTS.txt` - Challenge game backend spec

---

**Status:** ✅ **Production Ready for Testing**

All frontend features are complete. Ready for backend integration.
