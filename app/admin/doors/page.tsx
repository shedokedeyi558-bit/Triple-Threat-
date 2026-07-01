"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminDoorsPage() {
  const { state, dispatch } = useAdmin();
  const [changingDoor, setChangingDoor] = useState<number | null>(null);

  const handleToggle = (doorId: number) => {
    const door = state.doors.find((d) => d.id === doorId);
    if (!door) return;
    dispatch({
      type: "UPDATE_DOOR",
      door: { ...door, status: door.status === "active" ? "inactive" : "active" },
    });
  };

  const handleChangeQuestion = (doorId: number) => {
    setChangingDoor(doorId === changingDoor ? null : doorId);
  };

  const handleSelectQuestion = (doorId: number, questionId: string) => {
    const door = state.doors.find((d) => d.id === doorId);
    const question = state.questions.find((q) => q.id === questionId);
    if (!door || !question) return;
    dispatch({
      type: "UPDATE_DOOR",
      door: { ...door, questionId, question, prize: question.prize, difficulty: question.difficulty },
    });
    setChangingDoor(null);
  };

  const diffColors = { Easy: "text-green-400", Medium: "text-yellow-400", Hard: "text-red-400" };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Door Configuration</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage what questions appear on each door</p>
      </div>

      {state.doors.map((door) => (
        <div key={door.id} className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div>
                <h3 className="text-white font-bold text-base">Door {door.id}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${door.status === "active" ? "bg-neon" : "bg-gray-600"}`} />
                  <span className="text-xs text-gray-400 capitalize">{door.status}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggle(door.id)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2A2A2A] hover:border-gray-400 text-gray-400 hover:text-white transition-colors"
            >
              {door.status === "active" ? <ToggleRight size={16} className="text-neon" /> : <ToggleLeft size={16} />}
              {door.status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>

          <div className="bg-[#111] rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 mb-1">Current question</p>
            <p className="text-sm text-white font-medium line-clamp-2">{door.question.text}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-base font-black ${diffColors[door.difficulty]}`}>
                ₦{door.prize.toLocaleString()}
              </span>
              <DifficultyBadge difficulty={door.difficulty} />
              <span className="text-xs text-gray-500">{door.question.timeLimit}s timer</span>
            </div>
          </div>

          <button
            onClick={() => handleChangeQuestion(door.id)}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-neon hover:text-white transition-colors"
          >
            <RefreshCw size={15} />
            {changingDoor === door.id ? "Cancel" : "Change Question →"}
          </button>

          {changingDoor === door.id && (
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs text-gray-500 mb-2">Select a question for Door {door.id}</p>
              {state.questions
                .filter((q) => q.status === "active" && q.id !== door.questionId)
                .map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(door.id, q.id)}
                    className="w-full text-left bg-[#111] border border-[#2A2A2A] hover:border-neon rounded-xl p-3 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <DifficultyBadge difficulty={q.difficulty} />
                      <span className="text-neon font-bold text-xs">₦{q.prize.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">{q.text}</p>
                  </button>
                ))}
              {state.questions.filter((q) => q.status === "active" && q.id !== door.questionId).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-3">No other active questions available</p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Auto-rotation settings */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
        <h3 className="text-white font-bold mb-4">Auto-rotation Settings</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white font-medium">Enable auto-rotation</p>
            <p className="text-xs text-gray-400 mt-0.5">Automatically change questions on a schedule</p>
          </div>
          <button
            onClick={() =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { autoRotate: !state.settings.autoRotate },
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              state.settings.autoRotate ? "bg-neon" : "bg-[#2A2A2A]"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                state.settings.autoRotate ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Rotate every</label>
          <select
            value={state.settings.autoRotateInterval}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { autoRotateInterval: Number(e.target.value) },
              })
            }
            disabled={!state.settings.autoRotate}
            className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm outline-none disabled:opacity-50"
          >
            {[15, 30, 60, 120, 240].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
