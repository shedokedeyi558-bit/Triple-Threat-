export type QuestionFormat = "multiple_choice" | "type_answer";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type DoorStatus = "active" | "inactive";
export type GameStatus = "pending" | "won" | "lost";
export type WithdrawalStatus = "pending" | "approved" | "rejected";
export type TransactionType = "win" | "entry_fee" | "deposit" | "withdrawal" | "bonus";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  doorId: number;
  text: string;
  format: QuestionFormat;
  difficulty: Difficulty;
  prize: number;
  timeLimit: number;
  options?: Option[];
  correctAnswer?: string;
  caseSensitive?: boolean;
  spellingTolerance?: "strict" | "lenient";
  status: "active" | "inactive";
  createdAt: string;
}

export interface Door {
  id: number;
  status: DoorStatus;
  questionId: string;
  question: Question;
  prize: number;
  difficulty: Difficulty;
  entryFee: number;
}

export interface Player {
  id: string;
  phone: string;
  name?: string;
  balance: number;
  gamesPlayed: number;
  gamesWon: number;
  totalWon: number;
  status: "active" | "banned";
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  doorId?: number;
}

export interface GameSession {
  id: string;
  playerId: string;
  doorId: number;
  questionId: string;
  status: GameStatus;
  playerAnswer?: string;
  correctAnswer: string;
  prize: number;
  entryFee: number;
  playedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  playerId: string;
  playerPhone: string;
  amount: number;
  method: string;
  accountNumber: string;
  bankName: string;
  status: WithdrawalStatus;
  createdAt: string;
}

export interface AdminStats {
  playsToday: number;
  revenueToday: number;
  payoutsToday: number;
  profitToday: number;
}

export interface AppSettings {
  entryFee: number;
  minWithdrawal: number;
  maxDailyPlays: number;
  newUserBonus: number;
  autoRotate: boolean;
  autoRotateInterval: number;
  autoApproveWithdrawals: boolean;
  autoApproveLimit: number;
  gameName: string;
  primaryColor: string;
  gameKillSwitch: boolean;
  payoutBankName: string;
  payoutAccountName: string;
  payoutAccountNumber: string;
}
