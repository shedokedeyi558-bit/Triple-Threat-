import type { Question, Door, Player, Transaction, GameSession, WithdrawalRequest, AdminStats, AppSettings } from "./types";

export const mockQuestions: Question[] = [
  {
    id: "q1",
    doorId: 1,
    text: "What is the capital city of Nigeria?",
    format: "multiple_choice",
    difficulty: "Easy",
    prize: 500,
    timeLimit: 15,
    options: [
      { id: "a", text: "Lagos", isCorrect: false },
      { id: "b", text: "Abuja", isCorrect: true },
      { id: "c", text: "Kano", isCorrect: false },
      { id: "d", text: "Ibadan", isCorrect: false },
    ],
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "q2",
    doorId: 2,
    text: "Who wrote the novel 'Things Fall Apart'?",
    format: "multiple_choice",
    difficulty: "Medium",
    prize: 2000,
    timeLimit: 10,
    options: [
      { id: "a", text: "Wole Soyinka", isCorrect: false },
      { id: "b", text: "Chimamanda Adichie", isCorrect: false },
      { id: "c", text: "Chinua Achebe", isCorrect: true },
      { id: "d", text: "Ben Okri", isCorrect: false },
    ],
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "q3",
    doorId: 3,
    text: "What is the chemical symbol for gold?",
    format: "type_answer",
    difficulty: "Hard",
    prize: 5000,
    timeLimit: 10,
    correctAnswer: "Au",
    caseSensitive: false,
    spellingTolerance: "strict",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "q4",
    doorId: 1,
    text: "What year did Nigeria gain independence?",
    format: "multiple_choice",
    difficulty: "Easy",
    prize: 500,
    timeLimit: 15,
    options: [
      { id: "a", text: "1956", isCorrect: false },
      { id: "b", text: "1960", isCorrect: true },
      { id: "c", text: "1963", isCorrect: false },
      { id: "d", text: "1970", isCorrect: false },
    ],
    status: "active",
    createdAt: "2024-01-16",
  },
  {
    id: "q5",
    doorId: 2,
    text: "Which planet is closest to the Sun?",
    format: "type_answer",
    difficulty: "Medium",
    prize: 2000,
    timeLimit: 10,
    correctAnswer: "Mercury",
    caseSensitive: false,
    spellingTolerance: "lenient",
    status: "active",
    createdAt: "2024-01-16",
  },
  {
    id: "q6",
    doorId: 3,
    text: "In what year was the internet invented?",
    format: "multiple_choice",
    difficulty: "Hard",
    prize: 5000,
    timeLimit: 10,
    options: [
      { id: "a", text: "1969", isCorrect: true },
      { id: "b", text: "1985", isCorrect: false },
      { id: "c", text: "1991", isCorrect: false },
      { id: "d", text: "1999", isCorrect: false },
    ],
    status: "inactive",
    createdAt: "2024-01-17",
  },
];

export const mockDoors: Door[] = [
  {
    id: 1,
    status: "active",
    questionId: "q1",
    question: mockQuestions[0],
    prize: 500,
    difficulty: "Easy",
    entryFee: 500,
  },
  {
    id: 2,
    status: "active",
    questionId: "q2",
    question: mockQuestions[1],
    prize: 2000,
    difficulty: "Medium",
    entryFee: 500,
  },
  {
    id: 3,
    status: "active",
    questionId: "q3",
    question: mockQuestions[2],
    prize: 5000,
    difficulty: "Hard",
    entryFee: 500,
  },
];

export const mockPlayers: Player[] = [
  {
    id: "p1",
    phone: "08034567890",
    name: "Emeka Obi",
    balance: 2500,
    gamesPlayed: 18,
    gamesWon: 9,
    totalWon: 14500,
    status: "active",
    createdAt: "2024-01-01",
  },
  {
    id: "p2",
    phone: "07012345678",
    name: "Fatima Yusuf",
    balance: 0,
    gamesPlayed: 25,
    gamesWon: 11,
    totalWon: 22000,
    status: "active",
    createdAt: "2024-01-03",
  },
  {
    id: "p3",
    phone: "09067891234",
    name: "Chidi Nwosu",
    balance: 1000,
    gamesPlayed: 7,
    gamesWon: 2,
    totalWon: 3000,
    status: "active",
    createdAt: "2024-01-10",
  },
  {
    id: "p4",
    phone: "08109876543",
    balance: 0,
    gamesPlayed: 40,
    gamesWon: 5,
    totalWon: 8500,
    status: "banned",
    createdAt: "2023-12-20",
  },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", type: "win", amount: 2000, description: "Won ₦2,000 (Door 2)", doorId: 2, createdAt: "2024-01-15T14:30:00" },
  { id: "t2", type: "entry_fee", amount: -500, description: "Entry fee (Door 2)", doorId: 2, createdAt: "2024-01-15T14:25:00" },
  { id: "t3", type: "deposit", amount: 1000, description: "Wallet deposit", createdAt: "2024-01-15T13:00:00" },
  { id: "t4", type: "withdrawal", amount: -3000, description: "Bank transfer withdrawal", createdAt: "2024-01-14T10:00:00" },
  { id: "t5", type: "entry_fee", amount: -500, description: "Entry fee (Door 1)", doorId: 1, createdAt: "2024-01-14T09:00:00" },
  { id: "t6", type: "win", amount: 500, description: "Won ₦500 (Door 1)", doorId: 1, createdAt: "2024-01-14T09:05:00" },
];

export const mockWithdrawals: WithdrawalRequest[] = [
  { id: "w1", playerId: "p1", playerPhone: "08034567890", amount: 2000, method: "PalmPay", accountNumber: "8123456789", bankName: "PalmPay", status: "pending", createdAt: "2024-01-15T14:35:00" },
  { id: "w2", playerId: "p2", playerPhone: "07012345678", amount: 5000, method: "Bank Transfer", accountNumber: "0123456789", bankName: "GTBank", status: "pending", createdAt: "2024-01-15T13:20:00" },
  { id: "w3", playerId: "p3", playerPhone: "09067891234", amount: 1000, method: "OPay", accountNumber: "7012345678", bankName: "OPay", status: "pending", createdAt: "2024-01-15T12:00:00" },
  { id: "w4", playerId: "p1", playerPhone: "08034567890", amount: 3000, method: "Bank Transfer", accountNumber: "0123456789", bankName: "Access Bank", status: "approved", createdAt: "2024-01-14T10:00:00" },
  { id: "w5", playerId: "p2", playerPhone: "07012345678", amount: 1500, method: "PalmPay", accountNumber: "8123456789", bankName: "PalmPay", status: "approved", createdAt: "2024-01-14T09:00:00" },
  { id: "w6", playerId: "p4", playerPhone: "08109876543", amount: 10000, method: "Bank Transfer", accountNumber: "1234567890", bankName: "Zenith Bank", status: "rejected", createdAt: "2024-01-13T08:00:00" },
];

export const mockAdminStats: AdminStats = {
  playsToday: 342,
  revenueToday: 68400,
  payoutsToday: 32500,
  profitToday: 35900,
};

export const mockRecentGames: GameSession[] = [
  { id: "g1", playerId: "p1", doorId: 2, questionId: "q2", status: "won", correctAnswer: "Chinua Achebe", playerAnswer: "Chinua Achebe", prize: 2000, entryFee: 500, playedAt: "2024-01-15T14:28:00" },
  { id: "g2", playerId: "p2", doorId: 1, questionId: "q1", status: "lost", correctAnswer: "Abuja", playerAnswer: "Lagos", prize: 0, entryFee: 500, playedAt: "2024-01-15T14:20:00" },
  { id: "g3", playerId: "p3", doorId: 3, questionId: "q3", status: "won", correctAnswer: "Au", playerAnswer: "Au", prize: 5000, entryFee: 500, playedAt: "2024-01-15T14:10:00" },
  { id: "g4", playerId: "p1", doorId: 1, questionId: "q1", status: "won", correctAnswer: "Abuja", playerAnswer: "Abuja", prize: 500, entryFee: 500, playedAt: "2024-01-15T13:55:00" },
];

export const mockRevenueData = [
  { hour: "8am", revenue: 4500, payouts: 2000 },
  { hour: "9am", revenue: 7200, payouts: 3500 },
  { hour: "10am", revenue: 9800, payouts: 4200 },
  { hour: "11am", revenue: 8500, payouts: 3800 },
  { hour: "12pm", revenue: 11200, payouts: 5500 },
  { hour: "1pm", revenue: 10400, payouts: 4800 },
  { hour: "2pm", revenue: 16700, payouts: 8700 },
];

export const mockDoorPopularity = [
  { name: "Door 1 (Easy)", value: 45, color: "#00FF66" },
  { name: "Door 2 (Medium)", value: 35, color: "#FFD700" },
  { name: "Door 3 (Hard)", value: 20, color: "#FF4444" },
];

export const mockHourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  plays: Math.floor(Math.random() * 30),
}));

export const mockAppSettings: AppSettings = {
  entryFee: 500,
  minWithdrawal: 1000,
  maxDailyPlays: 20,
  newUserBonus: 0,
  autoRotate: true,
  autoRotateInterval: 30,
  autoApproveWithdrawals: false,
  autoApproveLimit: 1000,
  gameName: "Triple Threat",
  primaryColor: "#00FF66",
  gameKillSwitch: false,
  payoutBankName: "Opay",
  payoutAccountName: "Triple Threat Games",
  payoutAccountNumber: "9012345678",
};

export const recentWinners = [
  "0803***4567 won ₦2,000",
  "0701***2345 won ₦500",
  "0906***7890 won ₦5,000",
  "0812***3456 won ₦2,000",
  "0703***9876 won ₦500",
  "0816***1234 won ₦5,000",
  "0909***5678 won ₦2,000",
];
