/**
 * Centralized API client for Triple Threat backend.
 * Base URL read from NEXT_PUBLIC_API_URL env var.
 * Falls back to Next.js API routes for development.
 */

const getBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  }
  // Client-side - use Next.js API routes as default, fallback to external backend
  return ""; // Empty string means use relative paths (same origin)
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
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number>;
}

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

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  }

  return json.data as T;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface SignUpResponse {
  token: string;
  player: { id: string; email: string; phone: string; name: string | null; balance: number; is_admin: boolean };
}

export interface SignInResponse {
  token: string;
  player: { id: string; email: string; phone: string; name: string | null; balance: number; is_admin: boolean };
}

export interface VerifyOtpResponse {
  token: string;
  player: { id: string; phone: string; name: string | null; balance: number };
}

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
  register: (phone: string, name?: string) =>
    request<VerifyOtpResponse>("/api/auth/register", { method: "POST", body: { phone, name } }),

  verifyOtp: (phone: string, otp: string) =>
    request<VerifyOtpResponse>("/api/auth/verify-otp", { method: "POST", body: { phone, otp } }),

  adminLogin: (email: string, password: string) =>
    request<AdminLoginResponse>("/api/auth/admin-login", { method: "POST", body: { email, password } }),
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

export interface BalanceResponse { balance: number }

export interface DepositResponse {
  authorizationUrl: string;
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

  withdraw: (amount: number, method: string, accountNumber: string, bankName: string) =>
    request<WithdrawResponse>("/api/wallet/withdraw", {
      method: "POST", body: { amount, method, accountNumber, bankName }, token: getToken(),
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
  balance: number;
  games_played: number;
  games_won: number;
  total_won: number;
  status: "active" | "banned";
  created_at: string;
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

  toggleBan: (id: string) =>
    request<{ player: AdminPlayer; message: string }>(`/api/admin/players/${id}/ban`, {
      method: "PUT", token: getAdminToken(),
    }),

  // Settings
  getSettings: () =>
    request<{ settings: BackendSettings }>("/api/admin/settings", { token: getAdminToken() }),

  updateSettings: (data: Partial<BackendSettings>) =>
    request<{ settings: BackendSettings }>("/api/admin/settings", {
      method: "PUT", body: data, token: getAdminToken(),
    }),

  // Kill switch — backend toggles automatically, no body needed
  toggleKillSwitch: () =>
    request<{ gameKillSwitch: boolean; message: string }>("/api/admin/kill-switch", {
      method: "POST", token: getAdminToken(),
    }),

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
};
