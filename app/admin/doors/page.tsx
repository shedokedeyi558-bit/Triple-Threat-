"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, type AdminDoorRow, type AdminQuestion, ApiError } from "@/lib/api";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { RefreshCw, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import type { Difficulty } from "@/lib/types";

export default function AdminDoorsPage() {
  const [doors, setDoors] = useState<AdminDoorRow[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingDoor, setChangingDoor] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval, setRotateInterval] = useState(30);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, qRes, sRes] = await Promise.all([
        adminApi.getDoors(),
        adminApi.getQuestions({ limit: 100 }),
        adminApi.getSettings(),
      ]);
      setDoors(dRes.doors);
      setQuestions(qRes.questions);
      setAutoRotate(sRes.settings.auto_rotate);
      setRotateInterval(sRes.settings.auto_rotate_interval);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleDoor = async (doorId: number) => {
    const door = doors.find((d) => d.id === doorId);
    if (!door) return;
    const newStatus = door.status === "active" ? "inactive" : "active";
    try {
      const res = await adminApi.updateDoor(doorId, { status: newStatus });
      setDoors((prev) => prev.map((d) => d.id === doorId ? { ...d, status: res.door.status } : d));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const handleSelectQuestion = async (doorId: number, questionId: string) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    try {
      await adminApi.updateDoor(doorId, { question_id: questionId, prize: q.prize });
      setDoors((prev) => prev.map((d) =>
        d.id === doorId
          ? { ...d, question_id: questionId, prize: q.prize, questions: q as unknown as AdminDoorRow["questions"] }
          : d
      ));
      setChangingDoor(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Update failed");
    }
  };

  const handleAutoRotateToggle = async () => {
    const next = !autoRotate;
    setAutoRotate(next);
    try {
      await adminApi.updateSettings({ auto_rotate: next });
    } catch { setAutoRotate(!next); }
  };

  const handleIntervalChange = async (val: number) => {
    setRotateInterval(val);
    try {
      await adminApi.updateSettings({ auto_rotate_interval: val });
    } catch { /* revert is fine — cosmetic setting */ }
  };

  const diffColors: Record<string, string> = {
    Easy: "text-green-400", Medium: "text-yellow-400", Hard: "text-red-400",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-neon animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Door Configuration</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage what questions appear on each door</p>
      </div>

      {doors.map((door) => (
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
              onClick={() => handleToggleDoor(door.id)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#2A2A2A] hover:border-gray-400 text-gray-400 hover:text-white transition-colors"
            >
              {door.status === "active"
                ? <><ToggleRight size={16} className="text-neon" /> Deactivate</>
                : <><ToggleLeft size={16} /> Activate</>}
            </button>
          </div>

          <div className="bg-[#111] rounded-xl p-4 space-y-2">
            <p className="text-xs text-gray-500 mb-1">Current question</p>
            {door.questions ? (
              <>
                <p className="text-sm text-white font-medium line-clamp-2">{door.questions.text}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-base font-black ${diffColors[door.questions.difficulty] ?? "text-gray-400"}`}>
                    ₦{door.prize.toLocaleString()}
                  </span>
                  {door.questions.difficulty && (
                    <DifficultyBadge difficulty={door.questions.difficulty as Difficulty} />
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No question assigned</p>
            )}
          </div>

          <button
            onClick={() => setChangingDoor(changingDoor === door.id ? null : door.id)}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-neon hover:text-white transition-colors"
          >
            <RefreshCw size={15} />
            {changingDoor === door.id ? "Cancel" : "Change Question →"}
          </button>

          {changingDoor === door.id && (
            <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
              <p className="text-xs text-gray-500 mb-2">Select a question for Door {door.id}</p>
              {questions
                .filter((q) => q.status === "active" && q.id !== door.question_id)
                .map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(door.id, q.id)}
                    className="w-full text-left bg-[#111] border border-[#2A2A2A] hover:border-neon rounded-xl p-3 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {q.difficulty && <DifficultyBadge difficulty={q.difficulty as Difficulty} />}
                      <span className="text-neon font-bold text-xs">₦{q.prize.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {q.format === "multiple_choice" ? "MC" : "Type"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 line-clamp-2">{q.text}</p>
                  </button>
                ))}
              {questions.filter((q) => q.status === "active" && q.id !== door.question_id).length === 0 && (
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
            onClick={handleAutoRotateToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${autoRotate ? "bg-neon" : "bg-[#2A2A2A]"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${autoRotate ? "left-7" : "left-1"}`} />
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Rotate every</label>
          <select
            value={rotateInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            disabled={!autoRotate}
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
