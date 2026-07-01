"use client";

import React, {
  createContext, useContext, useReducer, useEffect, ReactNode,
} from "react";
import type { Question, Player, WithdrawalRequest, AppSettings } from "@/lib/types";
import { mockQuestions, mockDoors, mockPlayers, mockWithdrawals, mockAppSettings } from "@/lib/mockData";
import { getAdminToken, setAdminToken, removeAdminToken } from "@/lib/api";

interface AdminState {
  isAuthenticated: boolean;
  questions: Question[];
  doors: typeof mockDoors;
  players: Player[];
  withdrawals: WithdrawalRequest[];
  settings: AppSettings;
}

type Action =
  | { type: "ADMIN_LOGIN"; token: string }
  | { type: "ADMIN_LOGOUT" }
  | { type: "ADD_QUESTION"; question: Question }
  | { type: "UPDATE_QUESTION"; question: Question }
  | { type: "DELETE_QUESTION"; id: string }
  | { type: "UPDATE_DOOR"; door: typeof mockDoors[0] }
  | { type: "BAN_PLAYER"; id: string }
  | { type: "UNBAN_PLAYER"; id: string }
  | { type: "APPROVE_WITHDRAWAL"; id: string }
  | { type: "REJECT_WITHDRAWAL"; id: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> }
  | { type: "SET_QUESTIONS"; questions: Question[] }
  | { type: "SET_PLAYERS"; players: Player[] }
  | { type: "SET_WITHDRAWALS"; withdrawals: WithdrawalRequest[] };

const initialState: AdminState = {
  isAuthenticated: false,
  questions: mockQuestions,
  doors: mockDoors,
  players: mockPlayers,
  withdrawals: mockWithdrawals,
  settings: mockAppSettings,
};

function adminReducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case "ADMIN_LOGIN":
      return { ...state, isAuthenticated: true };
    case "ADMIN_LOGOUT":
      return { ...state, isAuthenticated: false };
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.question] };
    case "UPDATE_QUESTION":
      return { ...state, questions: state.questions.map(q => q.id === action.question.id ? action.question : q) };
    case "DELETE_QUESTION":
      return { ...state, questions: state.questions.filter(q => q.id !== action.id) };
    case "UPDATE_DOOR":
      return { ...state, doors: state.doors.map(d => d.id === action.door.id ? action.door : d) };
    case "BAN_PLAYER":
      return { ...state, players: state.players.map(p => p.id === action.id ? { ...p, status: "banned" } : p) };
    case "UNBAN_PLAYER":
      return { ...state, players: state.players.map(p => p.id === action.id ? { ...p, status: "active" } : p) };
    case "APPROVE_WITHDRAWAL":
      return { ...state, withdrawals: state.withdrawals.map(w => w.id === action.id ? { ...w, status: "approved" } : w) };
    case "REJECT_WITHDRAWAL":
      return { ...state, withdrawals: state.withdrawals.map(w => w.id === action.id ? { ...w, status: "rejected" } : w) };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "SET_QUESTIONS":
      return { ...state, questions: action.questions };
    case "SET_PLAYERS":
      return { ...state, players: action.players };
    case "SET_WITHDRAWALS":
      return { ...state, withdrawals: action.withdrawals };
    default:
      return state;
  }
}

const AdminContext = createContext<{
  state: AdminState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Rehydrate admin token on mount
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      dispatch({ type: "ADMIN_LOGIN", token });
    }
  }, []);

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
