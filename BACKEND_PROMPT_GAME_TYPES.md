# Backend Task: Support "pills" and "predictions" game_type values

## Context
The frontend admin panel creates games with `game_type: "pills"` or `game_type: "predictions"`.
The backend currently only accepts `"door_game"` and `"challenge_game"` as valid game_type values.
This mismatch causes game creation to fail or behave incorrectly.

---

## What to Change

### Endpoint: `POST /api/admin/games/create`

**Current accepted values:** `"door_game"` | `"challenge_game"`  
**New accepted values (add these):** `"pills"` | `"predictions"`

The frontend sends the following shapes:

### For PILLS game:
```json
{
  "game_type": "pills",
  "title": "What is the capital of France?",
  "question": "What is the capital of France?",
  "category": "General Knowledge",
  "entry_fee": 200,
  "prize": 1000,
  "timer": 30,
  "format": "multiple_choice",
  "options": ["Berlin", "Paris", "Rome", "Madrid"],
  "correct_answer": "Paris"
}
```

### For PREDICTIONS (Time Machine) game:
```json
{
  "game_type": "predictions",
  "title": "How many goals will Chelsea score?",
  "question": "How many goals will Chelsea score against Fulham on Saturday?",
  "category": "Football",
  "entry_fee": 500,
  "prize_per_winner": 2000,
  "max_slots": 20,
  "countdown_end": "2026-07-06T18:00:00.000Z"
}
```

---

## Expected Response (same shape for both)
```json
{
  "success": true,
  "data": {
    "game": {
      "id": "uuid-here",
      "game_type": "pills",
      "title": "...",
      "question": "...",
      "category": "...",
      "status": "draft",
      "entry_fee": 200,
      "prize": 1000,
      "timer": 30,
      "format": "multiple_choice",
      "options": ["Berlin", "Paris", "Rome", "Madrid"],
      "correct_answer": "Paris",
      "created_at": "2026-07-04T..."
    }
  }
}
```

---

## Also Required: `GET /api/admin/games/:id`

When fetching a game by ID, return the full game object including:
- `game_type` (must be `"pills"` or `"predictions"`)
- `question`
- `category`
- `entry_fee`
- `prize` (for pills)
- `prize_per_winner` (for predictions)
- `timer` (for pills)
- `format` (for pills: `"multiple_choice"` | `"type_answer"`)
- `options` (array of strings, for multiple_choice pills)
- `correct_answer` (for pills)
- `max_slots` (for predictions)
- `slots_filled` (for predictions)
- `countdown_end` (for predictions)
- `answer_revealed_at` (for predictions, null until revealed)
- `status`: `"draft"` | `"active"` | `"paused"` | `"locked"` | `"completed"` | `"cancelled"`
- `stats`: `{ total_players, revenue }`

---

## Also Required: `GET /api/admin/games`

Return all games (pills + predictions) with the same shape above.
Support optional query params: `?game_type=pills`, `?status=active`, `?page=1&limit=20`

---

## Game Lifecycle

### PILLS:
- Created as `"draft"` → admin activates → `"active"` → players can play → admin ends → `"completed"`
- Each player pays entry_fee, answers within timer, gets instant result
- correct_answer is stored server-side, never sent to player until after answer submission

### PREDICTIONS:
- Created as `"draft"` → admin activates → `"active"` → players submit answers before countdown_end
- After countdown_end, status auto-changes to `"locked"`
- Admin calls reveal-answer endpoint to mark correct answers and pay winners

---

## Notes
- Admin JWT token is passed as `Authorization: Bearer <token>` header
- All amounts are in Naira (NGN), stored as integers (kobo or naira — be consistent)
- The `correct_answer` for pills must NOT be returned to players in any player-facing endpoint
