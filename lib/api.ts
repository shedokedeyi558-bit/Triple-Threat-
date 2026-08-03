/**
 * Centralized API client for Triple Threat backend.
 * Base URL read from NEXT_PUBLIC_API_URL env var.
 * Falls back to Next.js API routes for development.
 */

const getBaseUrl = () => {
  // Always use the backend URL directly — both server-side and client-side
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
};

const BASE_URL = getBaseUrl();

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tt_token");
}
export function setToken(t: string) { localStorage.setItem("tt_token", t); }
export function removeToken() { localStorage.removeItem("tt_token"); }

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tt_admin_token");
}
export function setAdminToken(t: string) { localStorage.setItem("tt_admin_token", t); }
export function removeAdminToken() { localStorage.removeItem("tt_admin_token"); }

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number>;
}

// ── Session-expiry dedup — only one toast+redirect per 5s window ──────────
let _sessionExpiredAt = 0;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {})
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({
    success: false,
    error: "Invalid JSON response",
  }));

  // ── Global session-expiry handler ──────────────────────────────────────
  // Only fires when:
  //   1. A token was actually sent (guest/public calls don't have one)
  //   2. We haven't already fired within the last 5 seconds (dedup)
  const isSessionError =
    res.status === 401 ||
    json.code === "SESSION_EXPIRED" ||
    json.code === "INVALID_TOKEN" ||
    json.code === "TOKEN_EXPIRED";

  if (isSessionError && token && typeof window !== "undefined") {
    const now = Date.now();
    if (now - _sessionExpiredAt > 5000) {
      _sessionExpiredAt = now;
      import("@/components/ui/Toast").then(({ showToast }) => {
        showToast("Your session expired — please log in again", "warning");
      });
      setTimeout(() => {
        const isAdmin = window.location.pathname.startsWith("/admin");
        window.location.href = isAdmin ? "/admin/login" : "/signin";
      }, 800);
    }
    // Clear stored credentials regardless
    localStorage.removeItem("tt_token");
    localStorage.removeItem("tt_admin_token");
    localStorage.removeItem("tt_player");
    throw new ApiError(json.error || "Session expired", res.status, json.code);
  }

  // ── Rate-limit handler ─────────────────────────────────────────────────
  if (res.status === 429) {
    const retryAfter = json.retry_after_seconds ?? json.retryAfter;
    const mins = retryAfter ? Math.ceil(retryAfter / 60) : null;
    const msg = mins
      ? `Too many attempts — try again in ${mins} minute${mins !== 1 ? "s" : ""}`
      : "Too many attempts — please wait before trying again";
    throw new ApiError(msg, 429, "TOO_MANY_ATTEMPTS");
  }

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status, json.code);
  }

  return json.data as T;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface SignUpResponse {
  token: string;
  player: { id: string; email: string; phone: string; name: string | null; balance: number; bonus_balance?: number; is_admin: boolean };
}

export interface SignInResponse {
  token: string;
  player: { id: string; email: string; phone: string; name: string | null; balance: number; bonus_balance?: number; is_admin: boolean };
}

export interface RegisterResponse {
  token: string;
  player: { id: string; phone: string; name: string | null; balance: number; bonus_balance?: number };
  isExisting: boolean;
}
// Alias kept for any remaining references
export type VerifyOtpResponse = RegisterResponse;

export interface AdminLoginResponse {
  token: string;
  admin: { id: string; email: string };
}

export const authApi = {
  // New unified auth endpoints
  signUp: (email: string, password: string, phone: string, name?: string) =>
    request<SignUpResponse>("/api/auth/signup", { method: "POST", body: { email, password, phone, name } }),

  signIn: (email: string, password: string) =>
    request<SignInResponse>("/api/auth/signin", { method: "POST", body: { email, password } }),

  // Legacy endpoints (kept for backward compatibility)
  register: (phone: string, password: string, referral_code?: string) =>
    request<RegisterResponse>(
      referral_code ? `/api/auth/register?ref=${encodeURIComponent(referral_code)}` : "/api/auth/register",
      { method: "POST", body: { phone, password } }
    ),

  // verifyOtp kept for backward compat — backend endpoint still exists but frontend no longer calls it
  phoneSignIn: (phone: string, password: string) =>
    request<RegisterResponse>("/api/auth/phone-signin", { method: "POST", body: { phone, password } }),

  adminLogin: (email: string, password: string) =>
    request<AdminLoginResponse>("/api/auth/admin-login", { method: "POST", body: { email, password } }),

  forgotPassword: (phone: string) =>
    request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: { phone } }),

  resetPassword: (phone: string, newPassword: string) =>
    request<RegisterResponse>("/api/auth/reset-password", {
      method: "POST",
      body: { phone, new_password: newPassword },
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>("/api/auth/change-password", { method: "POST", body: { current_password: currentPassword, new_password: newPassword }, token: getToken() }),

  logoutAll: () =>
    request<{ message: string }>("/api/auth/logout-all", { method: "POST", token: getToken() }),

  adminLogoutAll: () =>
    request<{ message: string }>("/api/auth/admin-logout-all", { method: "POST", token: getAdminToken() }),
};

// ─── GAME ─────────────────────────────────────────────────────────────────────

export interface QuestionOption { id: string; text: string }

export interface ApiQuestion {
  id: string;
  text: string;
  format: "multiple_choice" | "type_answer";
  difficulty: "Easy" | "Medium" | "Hard";
  prize: number;
  time_limit: number;
  options: QuestionOption[] | null;
}

export interface ApiDoor {
  id: number;
  status: "active" | "inactive";
  prize: number;
  entry_fee: number;
  question: ApiQuestion;
}

export interface PlayResponse {
  sessionId: string;
  question: ApiQuestion;
  entryFee: number;
  newBalance: number;
}

export interface SubmitResponse {
  correct: boolean;
  prize: number;
  correctAnswer: string;
  message: string;
}

export interface RecentWinner {
  id: string;
  phone: string;
  doorId: number;
  prize: number;
  playedAt: string;
}

export const gameApi = {
  getDoors: () =>
    request<ApiDoor[]>("/api/game/doors"),

  play: (doorId: number) =>
    request<PlayResponse>("/api/game/play", {
      method: "POST", body: { doorId }, token: getToken(),
    }),

  submit: (sessionId: string, answer: string) =>
    request<SubmitResponse>("/api/game/submit", {
      method: "POST", body: { sessionId, answer }, token: getToken(),
    }),

  recentWinners: () =>
    request<RecentWinner[]>("/api/game/recent-winners"),
};

// ─── WALLET ───────────────────────────────────────────────────────────────────

export interface BalanceResponse { balance: number; bonus_balance?: number }

export interface DepositResponse {
  authorizationUrl: string;    // Squad hosted-page URL — redirect browser here
  reference: string;
  amount: number;
}

export interface VerifyDepositResponse {
  message: string;
  amount: number;
  newBalance: number;
  alreadyProcessed?: boolean;
}

export interface ApiTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string | null;
  created_at: string;
}

export interface TransactionsResponse {
  transactions: ApiTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface BankOption {
  name: string;
  code: string;
}

export interface ResolveAccountResponse {
  account_name: string;
  account_number: string;
}

export interface WithdrawResponse {
  message: string;
  withdrawal: { id: string; amount: number; status: string };
  newBalance: number;
}

export const walletApi = {
  getBalance: () =>
    request<BalanceResponse>("/api/wallet/balance", { token: getToken() }),

  deposit: (amount: number) =>
    request<DepositResponse>("/api/wallet/deposit", {
      method: "POST", body: { amount }, token: getToken(),
    }),

  verifyDeposit: (reference: string) =>
    request<VerifyDepositResponse>("/api/wallet/verify", {
      token: getToken(), params: { reference },
    }),

  getTransactions: (page = 1, limit = 20) =>
    request<TransactionsResponse>("/api/wallet/transactions", {
      token: getToken(), params: { page, limit },
    }),

  getBanks: () =>
    request<{ banks: BankOption[] }>("/api/wallet/banks", { token: getToken() }),

  resolveAccount: (accountNumber: string, bankCode: string) =>
    request<ResolveAccountResponse>("/api/wallet/resolve-account", {
      token: getToken(),
      params: { account_number: accountNumber, bank_code: bankCode },
    }),

  withdraw: (amount: number, accountNumber: string, bankName: string, bankCode: string) =>
    request<WithdrawResponse>("/api/wallet/withdraw", {
      method: "POST",
      body: { amount, accountNumber, bankName, bankCode },
      token: getToken(),
    }),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  playsToday: number;
  revenueToday: number;
  payoutsToday: number;
  profitToday: number;
  totalPlayers: number;
  pendingWithdrawals: number;
  // Prediction stats (added by backend)
  predictions?: {
    live?: number;      // active + locked — needs admin attention
    total?: number;
    active?: number;
    locked?: number;
    completed?: number;
    cancelled?: number;
  };
}

export interface AdminQuestion {
  id: string;
  door_id: number | null;
  text: string;
  format: "multiple_choice" | "type_answer";
  difficulty: "Easy" | "Medium" | "Hard" | null;
  prize: number;
  time_limit: number;
  options: QuestionOption[] | null;
  correct_answer: string;
  case_sensitive: boolean;
  spelling_tolerance: "strict" | "lenient";
  status: "active" | "inactive" | "deleted";
  created_at: string;
}

export interface AdminPlayer {
  id: string;
  phone: string;
  name: string | null;
  balance: number;           // may be absent on detail endpoint — use real_balance
  real_balance?: number;     // backend detail endpoint alias for balance
  bonus_balance: number;
  games_played: number;
  games_won: number;
  total_won: number;
  status: "active" | "banned";
  created_at: string;
}

export interface AdminPlayerDetail extends AdminPlayer {
  email?: string | null;
  ban_reason?: string | null;
  ban_history?: { reason: string; banned_at: string; banned_by?: string }[];
  referred_by?: { id: string; phone: string; name: string | null } | null;
  stats?: {
    games_played: number;
    games_won: number;
    win_rate: number;
    total_won: number;
    total_spent: number;
  };
}

export interface AdminActivityRow {
  id: string;
  type: string;
  description: string;
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface AdminReferralRow {
  id: string;
  phone: string;
  name: string | null;
  status: string;
  bonus_amount: number;
  created_at: string;
}

export interface AdminNote {
  id: string;
  content: string;
  created_at: string;
  created_by?: string;
}

export interface AdminWithdrawal {
  id: string;
  player_id: string;
  phone: string;
  amount: number;
  method: string;
  account_number: string;
  bank_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
  players?: { name: string | null };
}

export interface AdminDoorRow {
  id: number;
  status: "active" | "inactive";
  prize: number;
  entry_fee: number;
  question_id: string | null;
  questions: {
    id: string;
    text: string;
    format: string;
    difficulty: string;
    prize: number;
    status: string;
  } | null;
}

export interface BackendSettings {
  id: number;
  entry_fee: number;
  min_withdrawal: number;
  max_daily_plays: number;
  new_user_bonus: number;
  auto_rotate: boolean;
  auto_rotate_interval: number;
  auto_approve_withdrawals: boolean;
  auto_approve_limit: number;
  game_name: string;
  primary_color: string;
  game_kill_switch: boolean;
  payout_bank_name: string;
  payout_account_name: string;
  payout_account_number: string;
}

export interface RevenuePoint {
  period: string;
  revenue: number;
  payouts: number;
  profit: number;
  plays: number;
}

export interface DoorStat {
  doorId: number;
  plays: number;
  wins: number;
  revenue: number;
  payouts: number;
}

export interface GameParticipation {
  id: string;
  player_id: string;
  player_phone: string;
  answer: string;
  is_correct: boolean | null;
  amount_won: number;
  participated_at: string;
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  stake_amount: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  status: "active" | "locked" | "ended" | "closed";
  countdown_duration: number;
  ends_at: string;
  is_user_joined: boolean;
}

export interface ChallengeDetail extends Challenge {
  my_participation: {
    answer: string;
    is_correct: boolean | null;
    amount_won: number;
  } | null;
  correct_answer: string | null;
  has_ended: boolean;
}

export interface ChallengesResponse {
  challenges: Challenge[];
  total: number;
}

export const challengeApi = {
  getChallenges: () =>
    request<ChallengesResponse>("/api/challenges", { token: getToken() }),

  getChallenge: (id: string) =>
    request<ChallengeDetail>(`/api/challenges/${id}`, { token: getToken() }),

  joinChallenge: (id: string, answer: string) =>
    request<{ participation: { id: string }; newBalance: number }>(
      `/api/challenges/${id}/join`,
      { method: "POST", body: { answer }, token: getToken() }
    ),
};

export interface Game {
  id: string;
  game_type: "door_game" | "challenge_game";
  title: string;
  description?: string;
  status: "draft" | "active" | "paused" | "ended" | "locked" | "closed";
  entry_fee?: number;
  door_ids?: string[];
  category?: string;
  stake_amount?: number;
  prize_pool?: number;
  max_participants?: number;
  current_participants?: number;
  countdown_duration?: number;
  ends_at?: string;
  answer_revealed_at?: string;
  created_at: string;
  created_by: string;
  stats?: {
    total_players: number;
    revenue: number;
  };
}

// ─── PILLS ────────────────────────────────────────────────────────────────────

export interface PillData {
  id: string;
  question: string;
  category: string;
  price: number;
  prize: number;
  status: "available" | "played" | "expired";
  format: "multiple_choice" | "type_answer";
  options?: string[];
  timer: number;
}

export interface PillOpenResponse {
  question: string;
  category: string;
  format: "multiple_choice" | "type_answer";
  options?: string[];
  timer: number;
  prize: number;
  entryFee: number;
  resumed?: boolean;  // true when pill was paid but never answered — no charge occurred
}

export interface PillSubmitResponse {
  won: boolean;
  correctAnswer: string;
  prize?: number;
  newBalance: number;
}

export interface PillPackPill {
  id: string;
  color: string;
  price: number;
  prize: number;
  status: "available" | "pending" | "played";  // pending = paid but not yet answered
}

export interface PillPack {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive" | "draft";
  is_vip?: boolean;
  is_featured?: boolean;
  pack_type?: string;                // "special" for Specials packs
  // New fields from updated pack-details endpoints:
  entry_fee?: number;                // pack-level entry fee (mirrors pills[0].price)
  prize_amount?: number;             // pack-level prize
  question_count?: number | null;    // number of questions drawn per exam
  total_time_seconds?: number | null;
  time_limit_minutes?: number | null; // pre-converted by backend — use directly
  pass_threshold?: number | null;    // display copy only — use required_correct for enforcement
  required_correct?: number | null;  // server-enforced pass threshold
  entry_window_end?: string | null;
  available_question_count?: number | null;
  quiz_expires_at?: string | null;          // ISO timestamp — pack entry closes at this time
  // Entry cap fields (Specials only) — max_entries is fixed at 1 server-side, not admin-configurable
  entries_made?: number;             // current number of entries (0 or 1)
  entry_cap_reached?: boolean;       // true when the single allowed entry has been claimed
  // Specials attempt tracking
  user_attempted?: boolean;          // true if current player already sat this exam
  pills: PillPackPill[];
}

export interface PackQuestion {
  id: string;
  question: string;
  format: "multiple_choice" | "type_answer";
  options?: string[];
  correct_answer: string;
  timer?: number;              // present for pack questions (pills table); absent for library questions
  answer_input_mode?: "text" | "numeric";  // for type_answer questions; defaults to "text"
  times_shown?: number;        // absent for library questions (stats not tracked on templates)
  times_correct?: number;      // absent for library questions
  correct_rate?: number;       // absent for library questions (0–100 percentage)
  status: "active" | "inactive" | "deleted";
  created_at: string;
}

// ─── SPECIALS ─────────────────────────────────────────────────────────────────
// Exam-style: admin-configurable question count, total time, pass threshold.
// No per-question feedback — scores revealed at end only.
// POST /api/pills/vip/start        — returns attempt (backend route, live on Railway)
// POST /api/pills/vip/answer/:id   — submit answer for current question

export interface VipStartResponse {
  session_id: string;
  pack_id: string;
  pack_name: string;
  category: string;
  entry_fee: number;
  prize: number;
  total_questions: number;
  required_correct: number;      // pass threshold set by admin
  current_question_index: number;
  is_new_attempt: boolean;
  new_balance?: number;
  exam_duration?: number;        // total seconds for the whole exam (preferred over question.timer)
  question: {
    question: string;
    format: "multiple_choice" | "type_answer";
    options?: string[];
    answer_input_mode?: "text" | "numeric";  // for type_answer questions; defaults to "text"
    timer: number;               // fallback if exam_duration absent
  };
}

export interface VipAnswerResponse {
  correct: boolean;
  correct_answer: string;
  next_question?: {
    question: string;
    format: "multiple_choice" | "type_answer";
    options?: string[];
    answer_input_mode?: "text" | "numeric";  // for type_answer questions; defaults to "text"
    timer: number;
  };
  next_question_index?: number;
  // exam complete (all questions answered):
  streak_complete?: boolean;
  passed?: boolean;              // true = met required_correct threshold
  score?: number;                // how many correct out of total
  prize?: number;
  new_balance?: number;
  entry_fee: number;
  question_number: number;
}

export const specialsApi = {
  start: (packId: string) =>
    request<VipStartResponse>(`/api/pills/vip/start`, {
      method: "POST",
      // Backend validates against camelCase `packId` — send both names to be safe
      body: { pack_id: packId, packId },
      token: getToken(),
    }),

  answer: (attemptId: string, answer: string) =>
    request<VipAnswerResponse>(`/api/pills/vip/answer/${attemptId}`, {
      method: "POST",
      body: { answer },
      token: getToken(),
    }),
};

export const pillsApi = {
  getSpecials: () =>
    request<{ packs: PillPack[] }>("/api/pills/specials", { token: getToken() }),
};

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

export interface PredictionData {
  id: string;
  question: string;
  category: string;
  fee: number;
  prize_per_winner: number;
  slots_filled: number;
  max_slots: number;
  countdown_end: string;
  event_date?: string;
  status: "active" | "locked" | "completed" | "cancelled";
}

export interface PredictionEnterResponse {
  success: boolean;
  prediction: PredictionData;
  newBalance: number;
}

export interface PredictionSubmitResponse {
  success: boolean;
  message: string;
}

export interface PredictionResultResponse {
  won: boolean;
  correctAnswer: string;
  prize?: number;
  newBalance: number;
}

export interface MyPrediction {
  id: string;                          // prediction id
  question: string;
  category: string;
  fee: number;
  prize_per_winner: number;
  countdown_end: string;
  status?: "active" | "locked" | "completed" | "cancelled"; // may not be present
  state?: string;   // backend sends: "entered_not_submitted" | "submitted_waiting" | "completed_won" | "completed_lost" | "cancelled"
  // Participation fields
  my_answer: string | null;
  needs_submission: boolean;
  correct_answer: string | null;
  won: boolean | null;
  prize_won: number | null;
  amount_won?: number | null;          // settled endpoint sends amount_won instead of prize_won
  participated_at: string;
  completed_at?: string | null;        // present on settled predictions instead of countdown_end
}

export const predictionsApi = {
  getActive: () =>
    request<{ predictions: PredictionData[] }>("/api/predictions/active", { token: getToken() }),

  getOne: (predictionId: string) =>
    request<{ prediction: PredictionData }>(`/api/predictions/${predictionId}`, { token: getToken() }),

  // Returns all predictions the player has entered
  // Backend uses GET /api/predictions/my-predictions?status=active|settled
  getMine: async (): Promise<{ predictions: MyPrediction[] }> => {
    const [activeRes, settledRes] = await Promise.allSettled([
      request<{ predictions: MyPrediction[] }>("/api/predictions/my-predictions", { token: getToken(), params: { status: "active" } }),
      request<{ predictions: MyPrediction[] }>("/api/predictions/my-predictions", { token: getToken(), params: { status: "settled" } }),
    ]);
    const active = activeRes.status === "fulfilled" ? (activeRes.value.predictions ?? []) : [];
    const settled = settledRes.status === "fulfilled" ? (settledRes.value.predictions ?? []) : [];
    // Deduplicate by id in case backend returns overlapping results
    const seen = new Set<string>();
    const all = [...active, ...settled].filter(p => seen.has(p.id) ? false : (seen.add(p.id), true));
    return { predictions: all };
  },

  enter: (predictionId: string) =>
    request<PredictionEnterResponse>("/api/predictions/enter", {
      method: "POST",
      body: { predictionId },
      token: getToken(),
    }),

  submit: (predictionId: string, answer: string, idempotencyKey?: string) =>
    request<PredictionSubmitResponse>("/api/predictions/submit", {
      method: "POST",
      body: { predictionId, answer, ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}) },
      token: getToken(),
    }),

  getResult: (predictionId: string) =>
    request<PredictionResultResponse>(`/api/predictions/result/${predictionId}`, {
      token: getToken(),
    }),

  getMyAnswer: (predictionId: string) =>
    request<{ answer: string; submitted_at: string }>(`/api/predictions/my-answer/${predictionId}`, {
      token: getToken(),
    }),
};

// ─── BLITZ ───────────────────────────────────────────────────────────────────

export interface BlitzTournament {
  id: string;
  title: string;
  description?: string;
  entry_fee: number;
  question_count: number;
  time_limit_seconds: number;
  per_question_time_seconds?: number | null;  // NEW — per-question countdown; null = no per-question limit
  registration_start: string;
  tournament_start: string;
  tournament_end: string;
  status: "draft" | "registration" | "active" | "scoring" | "completed";
  total_registered: number;
  prize_pool: number;
  platform_cut_percent: number;
  // Configurable prize model fields (added to admin creation form)
  cash_winner_count?: number;
  payout_distribution?: number[];   // e.g. [50, 30, 20] — must sum to 100
  total_payout_percent?: number;    // % of revenue going to cash prizes
  ticket_tier_percent?: number;     // % of remaining going to free-ticket tier
  guaranteed_minimum?: number;
  max_participants?: number;
  position_prizes?: {               // NEW — non-cash prizes for specific positions
    position: number;
    prize_type: "free_ticket" | "discount";
    discount_percent?: number;
  }[];
  // Simplified prize model fields
  first_place_percent?: number;           // % of total revenue paid to 1st place
  third_place_discount_percent?: number;  // % discount off next entry for 3rd place
  created_at: string;
}

export interface BlitzQuestion {
  id: string;
  question: string;
  format: "multiple_choice" | "type_answer";
  options?: string[];
  answer_input_mode?: "text" | "numeric";  // for type_answer questions; defaults to "text"
  order_index: number;
  image_url?: string | null;               // NEW — optional question image
}

export interface BlitzAttemptStart {
  attempt_id: string;
  questions: BlitzQuestion[];
  time_limit_seconds: number;
  per_question_time_seconds?: number | null;  // NEW — per-question limit; null = disabled
  started_at: string;
}

export interface BlitzSubmitResponse {
  score: number;
  total_questions: number;
  rank_estimate: number;
  total_time_ms?: number;
  message?: string;
}

export interface BlitzAdminResults {
  tournament: {
    id: string;
    title: string;
    status: BlitzTournament["status"];
    entry_fee: number;
    total_registered: number;
    tournament_start: string;
    tournament_end: string;
  };
  scoring_event: {
    scored_at: string;
    triggered_by: "scheduler" | "admin" | "unknown";
  } | null;
  revenue: {
    total_revenue_actual: number;
    total_cash_paid_out: number;
    platform_kept: number;
    discrepancy: number;
    math_check: {
      match: boolean;
      formula: string;
    };
  };
  players: {
    player_id: string;
    player_phone: string;
    player_name?: string;
    submitted: boolean;
    rank: number | null;
    score: number | null;
    total_time_ms: number | null;
    entry_fee_paid: number;
    ticket_code_used?: string | null;
    prize: {
      prize_type: "cash" | "free_ticket" | "discount" | null;
      amount_credited?: number;
      discount_percent?: number;
      ticket_code?: string;
      ticket_status?: "unused" | "used" | "expired";
    } | null;
  }[];
}

export interface BlitzResult {
  tournament?: { title: string; prize_pool: number; total_registered: number };
  leaderboard: {
    position: number;
    player_phone: string;
    score: number;
    total_time_ms: number;
    prize_type?: "cash" | "free_ticket" | "discount";
    amount?: number;
  }[];
  my_position?: number;
  my_score?: number;
  // player object with real final rank (always correct, even outside top 20)
  player?: {
    position: number;
    score: number;
    total_time_ms?: number;
    prize?: {
      prize_type: "cash" | "free_ticket" | "discount" | null;
      amount: number;
      ticket_code?: string;
    } | null;
  } | null;
  my_prize?: {
    position?: number;
    prize_type: "cash" | "free_ticket" | "discount" | null;
    amount: number;
    ticket_code?: string;
  } | null;
}

export const blitzApi = {
  getAll: () =>
    request<{ tournaments: BlitzTournament[] }>("/api/blitz", { token: getToken() }),

  getOne: (id: string) =>
    request<{ tournament: BlitzTournament; is_registered: boolean; has_attempted: boolean }>(
      `/api/blitz/${id}`, { token: getToken() }
    ),

  register: (id: string, ticket_code?: string) =>
    request<{ message: string; newBalance: number; newBonusBalance?: number; entryFeePaid?: number }>(
      `/api/blitz/${id}/register`,
      { method: "POST", body: { ticket_code }, token: getToken() }
    ),

  startAttempt: (id: string) =>
    request<BlitzAttemptStart>(`/api/blitz/${id}/attempt/start`, {
      method: "POST", token: getToken()
    }),

  submitAttempt: (id: string, answers: { question_id: string; answer: string; time_taken_ms?: number }[]) =>
    request<BlitzSubmitResponse>(`/api/blitz/${id}/attempt/submit`, {
      method: "POST", body: { answers }, token: getToken()
    }),

  getResults: (id: string) =>
    request<BlitzResult>(`/api/blitz/${id}/results`, { token: getToken() }),
};

export const adminApi = {
  // Games Management
  createGame: (data: {
    game_type: "door_game" | "challenge_game";
    title: string;
    description?: string;
    entry_fee?: number;
    door_ids?: string[];
    category?: string;
    stake_amount?: number;
    prize_pool?: number;
    max_participants?: number;
    countdown_duration?: number;
  }) =>
    request<{ game: Game }>("/api/admin/games/create", {
      method: "POST",
      body: data,
      token: getAdminToken(),
    }),

  getGames: (params?: Record<string, string | number>) =>
    request<{ games: Game[]; total: number; page: number; limit: number }>(
      "/api/admin/games",
      { token: getAdminToken(), params }
    ),

  getGame: (id: string) =>
    request<{ game: Game }>(`/api/admin/games/${id}`, {
      token: getAdminToken(),
    }),

  updateGame: (id: string, data: Partial<Game>) =>
    request<{ game: Game }>(`/api/admin/games/${id}`, {
      method: "PUT",
      body: data,
      token: getAdminToken(),
    }),

  activateGame: (id: string) =>
    request<{ message: string; game: Game }>(`/api/admin/games/${id}/activate`, {
      method: "POST",
      token: getAdminToken(),
    }),

  pauseGame: (id: string) =>
    request<{ message: string }>(`/api/admin/games/${id}/pause`, {
      method: "POST",
      token: getAdminToken(),
    }),

  resumeGame: (id: string) =>
    request<{ message: string }>(`/api/admin/games/${id}/resume`, {
      method: "POST",
      token: getAdminToken(),
    }),

  endGame: (id: string) =>
    request<{ message: string }>(`/api/admin/games/${id}/end`, {
      method: "POST",
      token: getAdminToken(),
    }),

  deleteGame: (id: string) =>
    request<{ message: string }>(`/api/admin/games/${id}`, {
      method: "DELETE",
      token: getAdminToken(),
    }),

  revealGameAnswer: (id: string, correctAnswer: string) =>
    request<{ message: string; total_participants: number; total_correct: number; prize_per_winner: number; total_paid: number }>(
      `/api/admin/games/${id}/reveal-answer`,
      { method: "POST", body: { correct_answer: correctAnswer }, token: getAdminToken() }
    ),

  getGameStats: (id: string) =>
    request<{ game: Game; stats: { total_players: number; total_revenue: number; total_payout: number; profit: number; completion_rate?: number } }>(
      `/api/admin/games/${id}/stats`,
      { token: getAdminToken() }
    ),

  getGameParticipants: (id: string) =>
    request<{ participations: GameParticipation[]; total: number }>(
      `/api/admin/games/${id}/participants`,
      { token: getAdminToken() }
    ),

  // Challenges
  createChallenge: (data: {
    title: string;
    description: string;
    category: string;
    stake_amount: number;
    max_participants: number;
    countdown_duration: number;
  }) =>
    request<{ challenge: Challenge }>("/api/admin/challenges", {
      method: "POST",
      body: data,
      token: getAdminToken(),
    }),

  getChallenges: (params?: Record<string, string | number>) =>
    request<{ challenges: Challenge[]; total: number }>(
      "/api/admin/challenges",
      { token: getAdminToken(), params }
    ),

  updateChallenge: (id: string, data: Partial<Challenge>) =>
    request<{ challenge: Challenge }>(`/api/admin/challenges/${id}`, {
      method: "PUT",
      body: data,
      token: getAdminToken(),
    }),

  revealAnswer: (id: string, correctAnswer: string) =>
    request<{ message: string; total_correct: number; total_paid: number }>(
      `/api/admin/challenges/${id}/reveal-answer`,
      { method: "POST", body: { correct_answer: correctAnswer }, token: getAdminToken() }
    ),

  getChallengeParticipants: (id: string) =>
    request<{ participations: GameParticipation[]; total: number }>(
      `/api/admin/challenges/${id}/participants`,
      { token: getAdminToken() }
    ),

  // Stats
  getStats: () =>
    request<AdminStats>("/api/admin/stats", { token: getAdminToken() }),

  // Questions
  getQuestions: (params?: Record<string, string | number>) =>
    request<{ questions: AdminQuestion[]; total: number }>("/api/admin/questions", {
      token: getAdminToken(), params,
    }),

  createQuestion: (data: Partial<AdminQuestion>) =>
    request<{ question: AdminQuestion }>("/api/admin/questions", {
      method: "POST", body: data, token: getAdminToken(),
    }),

  updateQuestion: (id: string, data: Partial<AdminQuestion>) =>
    request<{ question: AdminQuestion }>(`/api/admin/questions/${id}`, {
      method: "PUT", body: data, token: getAdminToken(),
    }),

  deleteQuestion: (id: string) =>
    request<{ message: string }>(`/api/admin/questions/${id}`, {
      method: "DELETE", token: getAdminToken(),
    }),

  // Doors
  getDoors: () =>
    request<{ doors: AdminDoorRow[] }>("/api/admin/doors", { token: getAdminToken() }),

  updateDoor: (id: number, data: { question_id?: string; entry_fee?: number; status?: string; prize?: number }) =>
    request<{ door: AdminDoorRow }>(`/api/admin/doors/${id}`, {
      method: "PUT", body: data, token: getAdminToken(),
    }),

  // Players — backend uses PUT /:id/ban (toggles)
  getPlayers: (params?: Record<string, string | number>) =>
    request<{ players: AdminPlayer[]; total: number }>("/api/admin/players", {
      token: getAdminToken(), params,
    }),

  getPlayerDetail: (id: string) =>
    request<{ player: AdminPlayerDetail }>(`/api/admin/players/${id}`, {
      token: getAdminToken(),
    }),

  getPlayerActivity: (id: string, page = 1, limit = 20) =>
    request<{ transactions: AdminActivityRow[]; total: number }>(
      `/api/admin/players/${id}/activity`,
      { token: getAdminToken(), params: { page, limit } }
    ),

  getPlayerReferrals: (id: string) =>
    request<{ referred_by: AdminPlayerDetail["referred_by"]; referrals: AdminReferralRow[] }>(
      `/api/admin/players/${id}/referrals`,
      { token: getAdminToken() }
    ),

  getPlayerNotes: (id: string) =>
    request<{ notes: AdminNote[] }>(`/api/admin/players/${id}/notes`, {
      token: getAdminToken(),
    }),

  addPlayerNote: (id: string, content: string) =>
    request<{ note: AdminNote }>(`/api/admin/players/${id}/notes`, {
      method: "POST", body: { content }, token: getAdminToken(),
    }),

  toggleBan: (id: string) =>
    request<{ player: AdminPlayer; message: string }>(`/api/admin/players/${id}/ban`, {
      method: "PUT", token: getAdminToken(),
    }),

  banWithReason: (id: string, reason: string) =>
    request<{ player: AdminPlayer; message: string }>(`/api/admin/players/${id}/ban`, {
      method: "PUT", body: { reason }, token: getAdminToken(),
    }),

  // Settings
  getSettings: () =>
    request<{ settings: BackendSettings }>("/api/admin/settings", { token: getAdminToken() }),

  updateSettings: (data: Partial<BackendSettings>) =>
    request<{ settings: BackendSettings }>("/api/admin/settings", {
      method: "PUT", body: data, token: getAdminToken(),
    }),

  // Kill switch removed (no longer needed)

  // Analytics
  getRevenueAnalytics: (period: "hourly" | "daily" = "daily", days = 7) =>
    request<{ revenue: RevenuePoint[] }>("/api/admin/analytics/revenue", {
      token: getAdminToken(), params: { period, days },
    }),

  getDoorAnalytics: () =>
    request<{ doors: DoorStat[] }>("/api/admin/analytics/doors", { token: getAdminToken() }),

  getActivityAnalytics: () =>
    request<{ activity: { hour: string; plays: number }[] }>("/api/admin/analytics/activity", {
      token: getAdminToken(),
    }),

  // Pill Packs (admin)
  getPillPacks: (includeInactive?: boolean) => {
    const url = `/api/admin/pills/packs${includeInactive ? "?includeInactive=true" : ""}`;
    console.log("[DEBUG] getPillPacks called with includeInactive:", includeInactive, "URL:", url);
    return request<{ packs: PillPack[] }>(url, { token: getAdminToken() });
  },

  createPillPack: (data: { name: string; category: string; entry_fee: number; prize: number; question_count?: number; total_time_minutes?: number; required_correct?: number; target_bank_size?: number; quiz_expires_at?: string; idempotency_key?: string }) =>
    request<{ pack: { id: string; name: string; category: string; status: string } }>(
      "/api/admin/pills/packs",
      { method: "POST", body: { ...data, is_vip: true }, token: getAdminToken() }
    ),

  updatePillPack: (packId: string, data: { name?: string; category?: string; status?: string }) =>
    request<{ pack: { id: string; status: string } }>(
      `/api/admin/pills/packs/${packId}`,
      { method: "PUT", body: data, token: getAdminToken() }
    ),

  deletePillPack: (packId: string) =>
    request<{ message: string }>(
      `/api/admin/pills/packs/${packId}`,
      { method: "DELETE", token: getAdminToken() }
    ),

  deletePillPackForce: (packId: string) =>
    request<{ message: string }>(
      `/api/admin/pills/packs/${packId}?force=true`,
      { method: "DELETE", token: getAdminToken() }
    ),

  addPillToPack: (packId: string, data: {
    question: string;
    format: "multiple_choice" | "type_answer";
    options?: string[];
    correct_answer: string;
    timer: number;
    color?: string;
  }) =>
    request<{ pill: { id: string } }>(
      `/api/admin/pills/packs/${packId}/pills`,
      { method: "POST", body: data, token: getAdminToken() }
    ),

  // Question bank management
  getPackQuestions: (packId: string) =>
    request<{
      pack: { id: string; name: string; category: string; question_count: number | null; target_bank_size?: number | null };
      questions: PackQuestion[];
      stats: { total: number; bank_size: number; coverage_ratio: number };
    }>(`/api/admin/specials-bank/packs/${packId}/questions`, { token: getAdminToken() }),

  getPackLiveStats: (packId: string) =>
    request<{
      pack_id: string;
      live: number;
      won: number;
      lost: number;
      total: number;
      win_rate: number;
    }>(`/api/admin/pills/packs/${packId}/stats`, { token: getAdminToken() }),

  // Specials-only aggregate attempt stats — replaces removed getAllPacksLiveStats
  getSpecialsAttemptStats: () =>
    request<{
      totals: { live: number; won: number; lost: number; total: number; win_rate: number };
      by_pack: { pack_id: string; pack_name: string; live: number; won: number; lost: number; total: number; win_rate: number }[];
    }>(`/api/admin/pills/packs/attempt-stats`, { token: getAdminToken() }),

  updatePackQuestion: (packId: string, questionId: string, data: {
    question?: string;
    format?: "multiple_choice" | "type_answer";
    options?: string[];
    correct_answer?: string;
    timer?: number;
  }) =>
    request<{ question: PackQuestion }>(
      `/api/admin/pills/${questionId}`,
      { method: "PATCH", body: data, token: getAdminToken() }
    ),

  deletePackQuestion: (packId: string, questionId: string) =>
    request<{ message: string }>(
      `/api/admin/pills/${questionId}`,
      { method: "DELETE", token: getAdminToken() }
    ),

  bulkUploadQuestions: (packId: string, questions: {
    question: string; format: "multiple_choice" | "type_answer";
    options?: string[]; correct_answer: string; timer: number;
  }[]) =>
    request<{ inserted: number; errors: { index: number; error: string }[] }>(
      `/api/admin/specials-bank/packs/${packId}/bulk-add`,
      { method: "POST", body: { questions }, token: getAdminToken() }
    ),

  cloneBankFromPack: (targetPackId: string, sourcePackId: string) =>
    request<{ inserted: number }>(
      `/api/admin/specials-bank/packs/${targetPackId}/clone-from/${sourcePackId}`,
      { method: "POST", token: getAdminToken() }
    ),

  // Draft library (unattached question pool)
  getLibraryQuestions: () =>
    request<{ questions: PackQuestion[] }>("/api/admin/specials-bank/library", { token: getAdminToken() }),

  addLibraryQuestion: (data: {
    question: string; format: "multiple_choice" | "type_answer";
    options?: string[]; correct_answer: string;
  }) =>
    request<{ question: PackQuestion }>("/api/admin/specials-bank/library", {
      method: "POST", body: data, token: getAdminToken()
    }),

  updateLibraryQuestion: (id: string, data: Partial<PackQuestion>) =>
    request<{ question: PackQuestion }>(`/api/admin/specials-bank/library/${id}`, {
      method: "PATCH", body: data, token: getAdminToken()
    }),

  deleteLibraryQuestion: (id: string) =>
    request<{ message: string }>(`/api/admin/specials-bank/library/${id}`, {
      method: "DELETE", token: getAdminToken()
    }),

  deleteAllLibraryQuestions: () =>
    request<{ deleted: number }>(`/api/admin/specials-bank/library`, {
      method: "DELETE", token: getAdminToken()
    }),

  importFromLibrary: (packId: string, questionIds: string[]) =>
    request<{ inserted: number }>(
      `/api/admin/specials-bank/library/copy-to-pack`,
      { method: "POST", body: { question_ids: questionIds, pack_id: packId }, token: getAdminToken() }
    ),

  // Withdrawals — PUT for approve/reject
  getWithdrawals: (status?: string, page = 1, limit = 20) =>
    request<{ withdrawals: AdminWithdrawal[]; total: number }>("/api/admin/withdrawals", {
      token: getAdminToken(),
      params: { page, limit, ...(status ? { status } : {}) },
    }),

  approveWithdrawal: (id: string) =>
    request<{ withdrawal: AdminWithdrawal; message: string; transferError: string | null }>(
      `/api/admin/withdrawals/${id}/approve`,
      { method: "PUT", token: getAdminToken() }
    ),

  rejectWithdrawal: (id: string, reason?: string) =>
    request<{ withdrawal: AdminWithdrawal; message: string }>(
      `/api/admin/withdrawals/${id}/reject`,
      { method: "PUT", body: { reason }, token: getAdminToken() }
    ),

  // Export CSV — returns raw URL to open
  getExportUrl: (type: "sessions" | "players" | "withdrawals", days = 30) =>
    `${BASE_URL}/api/admin/export?type=${type}&days=${days}&token=${getAdminToken()}`,

  // Blitz
  getBlitzTournaments: () =>
    request<{ tournaments: BlitzTournament[] }>("/api/admin/blitz", { token: getAdminToken() }),

  getBlitzDetail: (id: string) =>
    request<{ tournament: BlitzTournament & {
      min_participants?: number;
      registration_start: string;
      tournament_start: string;
      tournament_end: string;
    }; questions: BlitzQuestion[] }>(`/api/admin/blitz/${id}`, { token: getAdminToken() }),

  updateBlitz: (id: string, data: Partial<{
    title: string; description: string; entry_fee: number;
    question_count: number; time_limit_seconds: number;
    per_question_time_seconds: number | null;
    max_participants: number; cash_winner_count: number;
    payout_distribution: number[]; total_payout_percent: number;
    registration_start: string; tournament_start: string; tournament_end: string;
    position_prizes: { position: number; prize_type: string; discount_percent?: number }[];
  }>) =>
    request<{ tournament: BlitzTournament }>(`/api/admin/blitz/${id}`, {
      method: "PUT", body: data, token: getAdminToken()
    }),

  deleteBlitzQuestion: (tournamentId: string, questionId: string) =>
    request<{ message: string }>(`/api/admin/blitz/${tournamentId}/questions/${questionId}`, {
      method: "DELETE", token: getAdminToken()
    }),

  createBlitz: (data: {
    title: string;
    description?: string;
    entry_fee: number;
    question_count: number;
    time_limit_seconds: number;
    per_question_time_seconds?: number | null;  // NEW
    registration_start: string;
    tournament_start: string;
    tournament_end: string;
    platform_cut_percent?: number;
    max_participants?: number;
    cash_winner_count?: number;
    payout_distribution?: number[];
    total_payout_percent?: number;
    ticket_tier_percent?: number;
    guaranteed_minimum?: number;
    first_place_percent?: number;
    third_place_discount_percent?: number;
  }) =>
    request<{ tournament: BlitzTournament; warnings?: string[] }>("/api/admin/blitz", {
      method: "POST", body: data, token: getAdminToken()
    }),

  addBlitzQuestion: (id: string, data: {
    question: string;
    format: "multiple_choice" | "type_answer";
    options?: string[];
    correct_answer: string;
    order_index?: number;
    image_url?: string;  // NEW
  }) =>
    request<{ question: BlitzQuestion }>(`/api/admin/blitz/${id}/questions`, {
      method: "POST", body: data, token: getAdminToken()
    }),

  uploadBlitzQuestionImage: (tournamentId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const token = getAdminToken();
    return fetch(`${BASE_URL}/api/admin/blitz/${tournamentId}/questions/upload-image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      const json = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
      if (!res.ok || !json.success) throw new ApiError(json.error || `Upload failed (${res.status})`, res.status);
      return json.data as { url: string };
    });
  },

  publishBlitz: (id: string) =>
    request<{ message: string }>(`/api/admin/blitz/${id}/publish`, {
      method: "POST", token: getAdminToken()
    }),

  activateBlitz: (id: string) =>
    request<{ message: string }>(`/api/admin/blitz/${id}/activate`, {
      method: "POST", token: getAdminToken()
    }),

  scoreBlitz: (id: string) =>
    request<{ message: string; winners: number }>(`/api/admin/blitz/${id}/score`, {
      method: "POST", token: getAdminToken()
    }),

  cancelBlitz: (id: string) =>
    request<{ message: string; refunded: number }>(`/api/admin/blitz/${id}/cancel`, {
      method: "POST", token: getAdminToken()
    }),

  getBlitzLeaderboard: (id: string) =>
    request<{ leaderboard: BlitzResult["leaderboard"] }>(`/api/admin/blitz/${id}/leaderboard`, {
      token: getAdminToken()
    }),

  getBlitzResults: (id: string) =>
    request<BlitzAdminResults>(`/api/admin/blitz/${id}/results`, {
      token: getAdminToken()
    }),

  // Analytics overview
  getAnalyticsOverview: (period: string) =>
    request<{
      period: string;
      money: { total_revenue: number; total_payouts: number; net_profit: number; pending_withdrawal_value: number };
      players: { total_registered: number; new_this_period: number; active_this_period: number };
      games: { pills_played: number; predictions_entered: number; blitz_registrations: number; total_plays: number };
      withdrawals: { total_requested: number; total_approved: number; total_pending: number; total_rejected: number };
    }>(`/api/admin/analytics/overview`, {
      token: getAdminToken(), params: { period },
    }),

  // Seed removed (no longer needed)

  // Predictions management
  createPrediction: (data: {
    question: string;
    category: string;
    entry_fee: number;
    prize_per_winner: number;
    max_slots: number;
    countdown_end: string;
    event_date?: string;
  }) => {
    // Backend may expect countdown_seconds (duration) instead of countdown_end (timestamp).
    // Send both so it works regardless of which the backend checks.
    const secondsFromNow = Math.max(
      60,
      Math.floor((new Date(data.countdown_end).getTime() - Date.now()) / 1000)
    );
    return request<{ prediction: any }>("/api/admin/predictions", {
      method: "POST",
      body: {
        ...data,
        countdown_seconds: secondsFromNow,
        // also send as countdown_duration in case backend uses that name
        countdown_duration: secondsFromNow,
      },
      token: getAdminToken(),
    });
  },

  getPrediction: (id: string) =>
    request<{ prediction: any }>(`/api/admin/predictions/${id}`, {
      token: getAdminToken(),
    }),

  getPredictions: (params?: Record<string, string | number>) =>
    request<{ predictions: any[]; total?: number }>(
      "/api/admin/predictions",
      { token: getAdminToken(), params }
    ),

  getPredictionParticipants: (id: string) =>
    request<{
      participations?: {
        id: string;
        player_id: string;
        player_phone: string | null;
        player_name?: string | null;
        answer: string | null;
        has_submitted: boolean;
        is_correct: boolean | null;
        amount_won: number;
        participated_at: string;
        submitted_at?: string | null;
      }[];
      participants?: {
        id: string;
        player_id: string;
        player_phone: string | null;
        player_name?: string | null;
        answer: string | null;
        has_submitted: boolean;
        is_correct: boolean | null;
        amount_won: number;
        participated_at: string;
        submitted_at?: string | null;
      }[];
      summary?: {
        total: number;
        submitted: number;
        pending_submission: number;
      };
    }>(`/api/admin/predictions/${id}/participants`, {
      token: getAdminToken(),
    }),

  revealPredictionAnswer: (id: string, correctAnswer: string) =>
    request<{ message: string; total_participants: number; total_correct: number; total_paid: number }>(
      `/api/admin/predictions/${id}/reveal-answer`,
      { method: "POST", body: { correct_answer: correctAnswer }, token: getAdminToken() }
    ),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "win" | "loss" | "new_event" | "withdrawal_approved" | "withdrawal_rejected" | "blitz_starting" | "prediction_result" | "announcement";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getAll: () =>
    request<{ notifications: Notification[]; unread_count: number }>("/api/notifications", {
      token: getToken(),
    }),

  markRead: (id?: string) =>
    request<{ message: string }>("/api/notifications/read", {
      method: "PUT",
      body: id ? { id } : {},
      token: getToken(),
    }),
};

export const adminNotificationsApi = {
  broadcast: (title: string, message: string) =>
    request<{ message: string; sent_count: number }>("/api/admin/notifications/broadcast", {
      method: "POST",
      body: { title, message, type: "announcement" },
      token: getAdminToken(),
    }),
};

// ─── PLAYER ───────────────────────────────────────────────────────────────────

export interface SpendSummary {
  spent_this_week: number;
  plays_today: number;
  plays_this_week: number;
}

export interface PlayLimits {
  daily_limit: number | null;
  weekly_limit: number | null;
}


export const playerApi = {
  getSpendSummary: () =>
    request<SpendSummary>("/api/wallet/spend-summary", { token: getToken() }),

  setPlayLimits: (daily_limit: number | null, weekly_limit: number | null) =>
    request<{ message: string; limits: PlayLimits }>("/api/player/limits", {
      method: "PUT",
      body: { daily_limit, weekly_limit },
      token: getToken(),
    }),

  getPlayLimits: () =>
    request<{ limits: PlayLimits }>("/api/player/limits", { token: getToken() }),
};

// ─── REFERRALS ────────────────────────────────────────────────────────────────

export interface ReferralStats {
  referral_code: string;
  referred_count: number;
  pending_count: number;
  completed_count: number;
  total_earned: number;
}

export interface ReferralTicket {
  id: string;
  code: string;
  type: "blitz" | "pill";
  expires_at: string;
  status: "active" | "used" | "expired";
}

export const referralApi = {
  getStats: () =>
    request<ReferralStats>("/api/player/referrals/stats", { token: getToken() }),

  getTickets: () =>
    request<{ tickets: ReferralTicket[] }>("/api/player/referrals/tickets", { token: getToken() }),

  redeemPillTicket: (pillId: string, ticketCode: string) =>
    request<{ message: string; newBalance: number }>(
      `/api/pills/open`,
      { method: "POST", body: { pillId, ticketCode }, token: getToken() }
    ),
};

// ─── BEAT THE ADMIN ───────────────────────────────────────────────────────────
// Player-facing: /api/admin-challenge/*
// Admin-facing:  /api/admin/beat-the-admin/*  (separate, not built here yet)

export type BtaMove = "rock" | "paper" | "scissors";
export type BtaWinner = "player" | "admin" | "draw";
export type BtaRequestStatus = "pending" | "approved" | "expired" | "rejected";

export interface BtaStatus {
  is_available: boolean;
  match_in_progress: boolean;
  min_stake: number;
  max_stake: number;
}

export interface BtaRequest {
  request_id: string;
  game_type: string;
  stake: number;
  status: BtaRequestStatus;
  expires_at: string;
  time_remaining_seconds?: number;
}

export interface BtaMatch {
  status: "in_progress" | "completed";
  player_move: BtaMove | null;
  admin_move: BtaMove | null;   // null until result is known (anti-cheat)
  winner: BtaWinner | null;
  payout: number;
}

export interface BtaMyRequestResponse {
  request: (BtaRequest & { time_remaining_seconds: number }) | null;
  match: BtaMatch | null;
}

export interface BtaMoveResponse {
  move_recorded: boolean;
  match_resolved: boolean;
  message?: string;
  // populated only when match_resolved: true
  winner?: BtaWinner;
  admin_move?: BtaMove;
  player_move?: BtaMove;
}

export interface BtaHistoryEntry {
  id: string;
  game_type: string;
  stake: number;
  request_status: BtaRequestStatus;
  created_at: string;
  match?: {
    winner: BtaWinner | null;
    player_move: BtaMove | null;
    admin_move: BtaMove | null;
    payout: number;
  } | null;
}

export const beatTheAdminApi = {
  getStatus: () =>
    request<{ success: boolean; data: BtaStatus }>("/api/admin-challenge/status", {
      token: getToken(),
    }),

  requestChallenge: (stake: number, game_type = "rps") =>
    request<{
      success: boolean;
      data: {
        request_id: string;
        game_type: string;
        stake: number;
        status: "pending";
        expires_at: string;
        new_balance: number;
        new_bonus_balance: number;
      };
    }>("/api/admin-challenge/request", {
      method: "POST",
      body: { game_type, stake },
      token: getToken(),
    }),

  getMyRequest: () =>
    request<{ success: boolean; data: BtaMyRequestResponse }>("/api/admin-challenge/my-request", {
      token: getToken(),
    }),

  submitMove: (requestId: string, move: BtaMove) =>
    request<{ success: boolean; data: BtaMoveResponse }>("/api/admin-challenge/move", {
      method: "POST",
      body: { requestId, move },
      token: getToken(),
    }),

  getHistory: (page = 1, limit = 20) =>
    request<{ success: boolean; data: { history: BtaHistoryEntry[]; total: number; page: number; limit: number } }>(
      "/api/admin-challenge/history",
      { token: getToken(), params: { page, limit } }
    ),
};

// Admin-facing Beat the Admin controls (separate from player beatTheAdminApi)

export interface BtaQueueEntry {
  id: string;           // request_id
  player_id: string;
  player_phone: string;
  game_type: string;
  stake: number;
  status: BtaRequestStatus;
  expires_at: string;
  time_remaining_seconds: number;
  created_at: string;
  match?: BtaMatch | null;
}

export const adminBtaApi = {
  // Read current availability (reuses player status endpoint, admin token)
  getStatus: () =>
    request<{ success: boolean; data: BtaStatus }>("/api/admin-challenge/status", {
      token: getAdminToken(),
    }),

  // Update availability + optionally stake range
  updateSettings: (settings: { is_available: boolean; min_stake?: number; max_stake?: number }) =>
    request<{ success: boolean; data: { is_available: boolean; min_stake: number; max_stake: number } }>(
      "/api/admin/beat-the-admin/settings",
      { method: "PUT", body: settings, token: getAdminToken() }
    ),

  // Pending request queue
  getQueue: () =>
    request<{ success: boolean; data: { requests: BtaQueueEntry[] } }>(
      "/api/admin/beat-the-admin/queue",
      { token: getAdminToken() }
    ),

  approveRequest: (requestId: string) =>
    request<{ success: boolean; data: { request_id: string; status: string } }>(
      `/api/admin/beat-the-admin/requests/${requestId}/approve`,
      { method: "POST", token: getAdminToken() }
    ),

  rejectRequest: (requestId: string) =>
    request<{ success: boolean; data: { request_id: string; status: string } }>(
      `/api/admin/beat-the-admin/requests/${requestId}/reject`,
      { method: "POST", token: getAdminToken() }
    ),

  // Admin submits their RPS move for an active match
  submitMove: (matchId: string, move: BtaMove) =>
    request<{ success: boolean; data: { winner: BtaWinner; admin_move: BtaMove; player_move: BtaMove; payout: number } }>(
      `/api/admin/beat-the-admin/match/${matchId}/move`,
      { method: "POST", body: { move }, token: getAdminToken() }
    ),
};
