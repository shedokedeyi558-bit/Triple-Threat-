# Admin Dashboard - Complete Implementation Guide

**Status**: Frontend ✅ Complete | Backend ⏳ Ready for Implementation

---

## 🎯 What's Been Built

### **Admin Dashboard Pages**

#### 1. **Dashboard Home** (`/admin`)
- Key metrics cards (Active Games, Players, Revenue, Total Games)
- Quick alerts for pending challenges awaiting answer reveal
- Overview of latest door games and challenges
- Quick stats cards (draft games, total revenue, completed challenges)

#### 2. **Games Management** (`/admin/games`)
- Unified list of all games (door games + challenges)
- Filter by game type (Door/Challenge)
- Filter by status (Draft, Active, Paused, Locked, Ended, Closed)
- Search by game title
- Game cards showing:
  - Game type icon (🚪 or ⚡)
  - Title and description
  - Key metrics (entry fee for doors, participants for challenges)
  - Status badge
  - Link to game details

#### 3. **Game Details** (`/admin/games/[id]`)
- Full game information display
- Action buttons based on status:
  - Draft: Activate
  - Active: Pause, End
  - Paused: Resume
  - Active (Challenge only): Reveal Answer button
- Participants table showing:
  - Player phone (masked)
  - Answer submitted
  - Correct? (for challenges after reveal)
  - Amount won (for challenges after reveal)
  - Time of participation
- Challenge reveal form (for active challenges):
  - Input field for correct answer
  - "Reveal & Calculate Winners" button
  - Shows calculation results

#### 4. **Game Creation** (`/admin/games/create`)
**4-Step Wizard:**

**Step 1: Choose Game Type**
- Door Game: Traditional 3-door immediate-win game
- Challenge Game: Limited-participation prediction game

**Step 2: Configure Game**
- Common fields: Title, Description
- Door Game specific: Entry Fee (₦)
- Challenge Game specific: Category, Entry Stake (₦), Prize Pool (₦), Max Participants, Countdown Duration (minutes)

**Step 3: Set Questions (Door Games Only)**
- For each of the 3 doors, admin sets:
  - Question text
  - Format (Multiple Choice or Type Answer)
  - Difficulty (Easy/Medium/Hard)
  - Prize amount
  - Time limit (seconds)
  - If Multiple Choice: 4 options + mark correct answer
  - If Type Answer: Single correct answer

**Step 4: Review**
- Display all game configuration
- For door games: Show all 3 questions in preview
- Create & Activate button

---

## 📋 API Endpoints Required (Backend TODO)

### **Games CRUD**
```
POST   /api/admin/games/create          - Create new game (door or challenge)
GET    /api/admin/games                 - List all games with filtering
GET    /api/admin/games/:id             - Get single game details
PUT    /api/admin/games/:id             - Update game (only if draft)
DELETE /api/admin/games/:id             - Delete game (only if draft)
```

### **Game Status Management**
```
POST   /api/admin/games/:id/activate    - Change status: draft → active
POST   /api/admin/games/:id/pause       - Change status: active → paused
POST   /api/admin/games/:id/resume      - Change status: paused → active
POST   /api/admin/games/:id/end         - Change status: any → ended
```

### **Challenge-Specific**
```
POST   /api/admin/games/:id/reveal-answer        - Reveal answer and calculate winners
GET    /api/admin/games/:id/participants         - List all participants and their answers
GET    /api/admin/games/:id/stats                - Get game statistics
```

---

## 📊 Data Structures

### **Game Creation Payload (Door Game)**
```javascript
{
  game_type: "door_game",
  title: "Daily Quiz #42",
  description: "Test your knowledge",
  entry_fee: 500,
  door_questions: [
    {
      door_number: 1,
      question: {
        text: "What is the capital of Nigeria?",
        format: "multiple_choice",
        difficulty: "Easy",
        prize: 500,
        time_limit: 15,
        options: ["Lagos", "Abuja", "Kano", "Ibadan"],
        correct_answer: "Abuja"
      }
    },
    // ... door 2 and 3
  ]
}
```

### **Game Creation Payload (Challenge Game)**
```javascript
{
  game_type: "challenge_game",
  title: "How many goals today?",
  description: "Chelsea vs Arsenal",
  category: "Football",
  stake_amount: 1000,
  prize_pool: 16000,
  max_participants: 20,
  countdown_duration: 60,  // minutes
}
```

### **Game Response Structure**
```javascript
{
  id: "game-uuid",
  game_type: "door_game" | "challenge_game",
  title: string,
  description: string,
  status: "draft" | "active" | "paused" | "locked" | "ended" | "closed",
  created_at: ISO8601,
  created_by: "admin-uuid",
  
  // Door game fields
  entry_fee: number,
  door_questions: DoorQuestion[],  // stored in DB
  
  // Challenge game fields
  category: string,
  stake_amount: number,
  prize_pool: number,
  max_participants: number,
  current_participants: number,
  countdown_duration: number,
  ends_at: ISO8601,
  answer_revealed_at: ISO8601 | null,
}
```

### **Participant Response**
```javascript
{
  id: "participation-uuid",
  player_phone: "08034567890",
  answer: "7",  // player's answer
  is_correct: boolean | null,  // null until admin reveals
  amount_won: number,  // 0 if wrong, calculated prize if correct
  participated_at: ISO8601,
}
```

---

## 🔑 Critical Backend Logic

### **1. Question Format Support**
- **Multiple Choice**: 4 options, admin marks one as correct
- **Type Answer**: Single correct answer (case-insensitive comparison)

### **2. Door Game Flow**
1. Admin creates game with 3 custom questions
2. Game status = "draft"
3. Admin activates game → status = "active"
4. Players can join and play immediately
5. Winners determined immediately upon answer submission
6. Admin can pause/resume/end at any time

### **3. Challenge Game Flow**
1. Admin creates challenge with prediction question (admin will manually set the answer)
2. Game status = "draft"
3. Admin activates game → status = "active", countdown starts, ends_at = now + countdown_duration
4. Players join and submit answers (stake is deducted)
5. Auto-lock when: max_participants reached OR countdown expires
6. Admin clicks "Reveal Answer":
   - Admin provides the correct answer
   - Backend evaluates ALL participants' answers
   - Winners identified
   - Prize pool split among winners: (total_stake × 0.8) / winner_count
   - All player balances updated
   - Transactions recorded
   - Status = "closed"

### **4. Answer Reveal Algorithm (Challenge)**
```
Correct participants = count where answer matches correct_answer
If correct participants = 0:
  - No payouts, app keeps all stakes
  - Status = "closed"

If correct participants > 0:
  - Prize per winner = (max_participants × stake_amount × 0.8) / correct_participants
  - For each correct participant:
    - Add transaction: type="challenge_win", amount=prize_per_winner
    - Update balance += prize_per_winner
  - For all participants:
    - Add transaction: type="challenge_loss", amount=-stake_amount
    - (These are already deducted at join time)
```

### **5. Status Transitions**
```
Door Game:
  draft → active → [paused ↔ active] → ended

Challenge Game:
  draft → active → [locked (auto or manual)] → ended (after reveal) → closed
```

---

## 🚀 Frontend Features (Complete)

✅ Dashboard overview with metrics
✅ Games list with filtering and search
✅ Game details page with full management
✅ 4-step game creation wizard
✅ Door question configuration (3 doors, manual Q&A setup)
✅ Challenge configuration
✅ Game action buttons (activate, pause, resume, end)
✅ Challenge reveal form with calculations
✅ Participants table with answers
✅ All status badges and styling
✅ Form validation and error handling
✅ Loading states and responsive design

---

## ⚠️ Backend Implementation Checklist

- [ ] Create `games` table with all required fields
- [ ] Create `game_participations` table (for challenges)
- [ ] Implement `POST /api/admin/games/create`
- [ ] Implement `GET /api/admin/games` with filtering
- [ ] Implement `GET /api/admin/games/:id`
- [ ] Implement `PUT /api/admin/games/:id`
- [ ] Implement `DELETE /api/admin/games/:id`
- [ ] Implement `POST /api/admin/games/:id/activate`
- [ ] Implement `POST /api/admin/games/:id/pause`
- [ ] Implement `POST /api/admin/games/:id/resume`
- [ ] Implement `POST /api/admin/games/:id/end`
- [ ] Implement `GET /api/admin/games/:id/participants`
- [ ] Implement `GET /api/admin/games/:id/stats`
- [ ] **Implement `POST /api/admin/games/:id/reveal-answer` (with winner calculation)**
- [ ] Add cron job for auto-locking challenges when timer expires
- [ ] Verify question format support (multiple choice + type answer)

---

## 📝 Example: Creating a Door Game

Admin goes to `/admin/games/create`:

1. **Step 1**: Selects "🚪 Door Game"
2. **Step 2**: Fills in
   - Title: "Daily Quiz #42"
   - Description: "Test your knowledge"
   - Entry Fee: ₦500
3. **Step 3**: Sets 3 questions
   - Door 1 (Easy, ₦500):
     - Q: "What is Nigeria's capital?"
     - Format: Multiple Choice
     - Options: Lagos, Abuja, Kano, Ibadan
     - Correct: Abuja
   - Door 2 (Medium, ₦2000):
     - Q: "Who wrote Things Fall Apart?"
     - Format: Multiple Choice
     - Options: Chinua Achebe, Wole Soyinka, Ben Okri, Chimamanda Adichie
     - Correct: Chinua Achebe
   - Door 3 (Hard, ₦5000):
     - Q: "What is the chemical symbol for gold?"
     - Format: Type Answer
     - Correct Answer: Au
4. **Step 4**: Reviews all settings and clicks "Create & Activate"
5. Game is created and immediately becomes active
6. Players can join and play

---

## 📝 Example: Creating a Challenge Game

Admin goes to `/admin/games/create`:

1. **Step 1**: Selects "⚡ Challenge Game"
2. **Step 2**: Fills in
   - Title: "How many goals today?"
   - Description: "Chelsea vs Arsenal"
   - Category: Football
   - Entry Stake: ₦1000
   - Prize Pool: ₦16,000
   - Max Participants: 20
   - Countdown: 60 minutes
3. **Step 3**: (No questions to set - challenge is prediction-based)
4. **Step 4**: Reviews and clicks "Create & Activate"
5. Game becomes active, countdown starts
6. Players join by submitting their prediction answer
7. When timer expires OR 20 participants reached: auto-lock
8. Admin goes to game detail page and enters the correct answer
9. Backend reveals answer, calculates winners, pays out

---

## 🎮 Ready for Testing

Once backend implements the endpoints:
1. Admin can create door games with custom questions
2. Admin can create challenges with any prediction question
3. All game management features work (pause, resume, end)
4. Challenge reveal calculates winners correctly
5. Participant list shows all answers and payouts

**Frontend mock API currently returns sample data for UI testing.**

---
