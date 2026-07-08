"use client";

import React, {
  createContext, useContext, useReducer, useEffect, ReactNode,
} from "react";
import type { QuestionFormat } from "@/lib/types";
import type { ApiDoor, ApiQuestion, PlayResponse, SubmitResponse } from "@/lib/api";
import { getToken, setToken, removeToken } from "@/lib/api";

// ─── State shape ──────────────────────────────────────────────────────────────

export interface PlayerInfo {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  balance: number;
  is_admin?: boolean;
}

interface ActiveSession {
  sessionId: string;
  doorId: number;
  question: ApiQuestion;
  entryFee: number;
  result?: {
    correct: boolean;
    prize: number;
    correctAnswer: string;
    playerAnswer: string;
  };
}

export interface Pill {
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

export interface Prediction {
  id: string;
  question: string;
  category: string;
  fee: number;
  prize_per_winner: number;
  slots_filled: number;
  max_slots: number;
  countdown_end: string;
  status: "active" | "locked" | "completed" | "cancelled";
}

interface PillState {
  selectedPill: Pill | null;
  pills: Pill[];
  pillsLoading: boolean;
  activePrediction: Prediction | null;
  predictions: Prediction[];
  predictionsLoading: boolean;
  userPredictionAnswer?: string;
}

interface AppState {
  isAuthenticated: boolean;
  player: PlayerInfo | null;
  selectedFormat: QuestionFormat | null;
  selectedDoor: ApiDoor | null;
  activeSession: ActiveSession | null;
  // live doors fetched from API
  doors: ApiDoor[];
  doorsLoading: boolean;
  doorsError: string | null;
  // Pills & Predictions
  pills: PillState;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOGIN"; player: PlayerInfo; token: string }
  | { type: "LOGOUT" }
  | { type: "SET_PLAYER"; player: PlayerInfo }
  | { type: "SET_FORMAT"; format: QuestionFormat }
  | { type: "SET_DOORS"; doors: ApiDoor[] }
  | { type: "DOORS_LOADING" }
  | { type: "DOORS_ERROR"; error: string }
  | { type: "SELECT_DOOR"; door: ApiDoor }
  | { type: "START_SESSION"; session: ActiveSession }
  | { type: "END_SESSION"; result: ActiveSession["result"] }
  | { type: "CLEAR_SESSION" }
  | { type: "UPDATE_BALANCE"; balance: number }
  | { type: "SET_PILLS"; pills: Pill[] }
  | { type: "PILLS_LOADING" }
  | { type: "SELECT_PILL"; pill: Pill }
  | { type: "CLEAR_PILL" }
  | { type: "SET_PREDICTIONS"; predictions: Prediction[] }
  | { type: "PREDICTIONS_LOADING" }
  | { type: "SELECT_PREDICTION"; prediction: Prediction }
  | { type: "SET_PREDICTION_ANSWER"; answer: string }
  | { type: "CLEAR_PREDICTION" };

const initialState: AppState = {
  isAuthenticated: false,
  player: null,
  selectedFormat: null,
  selectedDoor: null,
  activeSession: null,
  doors: [],
  doorsLoading: false,
  doorsError: null,
  pills: {
    selectedPill: null,
    pills: [],
    pillsLoading: false,
    activePrediction: null,
    predictions: [],
    predictionsLoading: false,
  },
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        player: action.player,
      };
    case "LOGOUT":
      return { ...initialState };
    case "SET_PLAYER":
      return { ...state, player: action.player };
    case "SET_FORMAT":
      return { ...state, selectedFormat: action.format };
    case "DOORS_LOADING":
      return { ...state, doorsLoading: true, doorsError: null };
    case "SET_DOORS":
      return { ...state, doors: action.doors, doorsLoading: false };
    case "DOORS_ERROR":
      return { ...state, doorsError: action.error, doorsLoading: false };
    case "SELECT_DOOR":
      return { ...state, selectedDoor: action.door };
    case "START_SESSION":
      return { ...state, activeSession: action.session };
    case "END_SESSION":
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: { ...state.activeSession, result: action.result },
        player: state.player
          ? {
              ...state.player,
              balance: action.result?.correct
                ? state.player.balance + (action.result.prize - state.activeSession.entryFee)
                : state.player.balance,
            }
          : null,
      };
    case "CLEAR_SESSION":
      return { ...state, activeSession: null, selectedDoor: null };
    case "UPDATE_BALANCE":
      return {
        ...state,
        player: state.player ? { ...state.player, balance: action.balance } : null,
      };
    case "SET_PILLS":
      return { ...state, pills: { ...state.pills, pills: action.pills, pillsLoading: false } };
    case "PILLS_LOADING":
      return { ...state, pills: { ...state.pills, pillsLoading: true } };
    case "SELECT_PILL":
      return { ...state, pills: { ...state.pills, selectedPill: action.pill } };
    case "CLEAR_PILL":
      return { ...state, pills: { ...state.pills, selectedPill: null } };
    case "SET_PREDICTIONS":
      return { ...state, pills: { ...state.pills, predictions: action.predictions, predictionsLoading: false } };
    case "PREDICTIONS_LOADING":
      return { ...state, pills: { ...state.pills, predictionsLoading: true } };
    case "SELECT_PREDICTION":
      return { ...state, pills: { ...state.pills, activePrediction: action.prediction } };
    case "SET_PREDICTION_ANSWER":
      return { ...state, pills: { ...state.pills, userPredictionAnswer: action.answer } };
    case "CLEAR_PREDICTION":
      return { ...state, pills: { ...state.pills, activePrediction: null, userPredictionAnswer: undefined } };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [hydrated, setHydrated] = React.useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const stored = localStorage.getItem("tt_player");
    if (token && stored) {
      try {
        const player = JSON.parse(stored) as PlayerInfo;
        dispatch({ type: "LOGIN", player, token });
      } catch {
        removeToken();
        localStorage.removeItem("tt_player");
      }
    }
    setHydrated(true);
  }, []);

  // Persist player info whenever it changes
  useEffect(() => {
    if (state.player) {
      localStorage.setItem("tt_player", JSON.stringify(state.player));
    } else {
      localStorage.removeItem("tt_player");
    }
  }, [state.player]);

  return (
    <AppContext.Provider value={{ state, dispatch, hydrated }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
