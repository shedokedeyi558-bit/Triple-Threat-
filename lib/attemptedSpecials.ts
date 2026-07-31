/**
 * Client-side cache for Specials packs the current player has already attempted.
 *
 * Keyed per player-id so accounts don't bleed into each other on shared devices.
 * Written immediately when:
 *   - The play page receives a 409 ALREADY_ATTEMPTED error
 *   - The player finishes an exam (exam_complete phase reached)
 *
 * Read by Specials card components to show the "Already Attempted" badge
 * without waiting on backend to add user_attempted to the pack list response.
 *
 * This is purely additive — when the backend does send user_attempted: true,
 * the cards will already be correct (the field takes precedence via OR).
 */

const STORAGE_KEY_PREFIX = "tt_attempted_specials_";

function storageKey(playerId: string): string {
  return `${STORAGE_KEY_PREFIX}${playerId}`;
}

/** Mark a pack as attempted for the given player. Idempotent. */
export function markSpecialAttempted(playerId: string, packId: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(playerId);
    const existing = getAttemptedSet(playerId);
    existing.add(packId);
    localStorage.setItem(key, JSON.stringify(Array.from(existing)));
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

/** Returns the Set of pack IDs this player has already attempted. */
export function getAttemptedSet(playerId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(playerId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

/** Returns true if the given player has already attempted this pack. */
export function hasAttempted(playerId: string | null | undefined, packId: string): boolean {
  if (!playerId) return false;
  return getAttemptedSet(playerId).has(packId);
}
