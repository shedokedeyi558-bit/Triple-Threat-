/**
 * Normalize win_rate for display (0–100 integer).
 * Backend confirmed: win_rate is always in 0-100 percentage format.
 * No fraction detection needed — use the value directly.
 */
export function normalizeWinRate(value: number | null | undefined): number | null {
  if (value == null) return null;
  return Math.round(value);
}
