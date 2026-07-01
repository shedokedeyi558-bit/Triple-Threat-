"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import type { QuestionFormat, Door, GameSession, Transaction } from "@/lib/types";
import { mockDoors, mockTransactions } from "@/lib/mockData";

interface AppState {
  // Auth
  isAuthenticated: boolean;
  playerPhone: string | null;
  // Wallet
  balance: number;
  transactions: Transaction[];
  // Game
  selectedFormat: QuestionFormat | null;
  selectedDoor: Door | null;
  currentSession: Partial<GameSession> | null;
  // Doors
  doors: Door[];
}

type Action =
  | { type: "LOGIN"; phone: string }
  | { type: "LOGOUT" }
  | { type: "SET_FORMAT"; format: QuestionFormat }
  | { type: "SELECT_DOOR"; door: Door }
  | { type: "START_SESSION"; session: Partial<GameSession> }
  | { type: "END_SESSION"; won: boolean; prize: number; entryFee: number; playerAnswer: string }
  | { type: "DEPOSIT"; amount: number }
  | { type: "SET_BALANCE"; balance: number }
  | { type: "CLEAR_SESSION" };

const initialState: AppState = {
  isAuthenticated: false,
  playerPhone: null,
  balance: 0,
  transactions: mockTransactions,
  selectedFormat: null,
  selectedDoor: null,
  currentSession: null,
  doors: mockDoors,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return { ...state, isAuthenticated: true, playerPhone: action.phone, balance: 2500 };
    case "LOGOUT":
      return { ...initialState };
    case "SET_FORMAT":
      return { ...state, selectedFormat: action.format };
    case "SELECT_DOOR":
      return { ...state, selectedDoor: action.door };
    case "START_SESSION":
      return { ...state, currentSession: action.session };
    case "END_SESSION": {
      const { won, prize, entryFee, playerAnswer } = action;
      const newBalance = won ? state.balance + prize : state.balance;
      const tx: Transaction = {
        id: `t${Date.now()}`,
        type: won ? "win" : "entry_fee",
        amount: won ? prize : -entryFee,
        description: won ? `Won ₦${prize.toLocaleString()} (Door ${state.selectedDoor?.id})` : `Entry fee -₦${entryFee} (Door ${state.selectedDoor?.id})`,
        doorId: state.selectedDoor?.id,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        balance: newBalance,
        transactions: [tx, ...state.transactions],
        currentSession: {
          ...state.currentSession,
          status: won ? "won" : "lost",
          playerAnswer,
          prize: won ? prize : 0,
        },
      };
    }
    case "DEPOSIT": {
      const depositTx: Transaction = {
        id: `t${Date.now()}`,
        type: "deposit",
        amount: action.amount,
        description: "Wallet deposit",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        balance: state.balance + action.amount,
        transactions: [depositTx, ...state.transactions],
      };
    }
    case "SET_BALANCE":
      return { ...state, balance: action.balance };
    case "CLEAR_SESSION":
      return { ...state, currentSession: null, selectedDoor: null };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
