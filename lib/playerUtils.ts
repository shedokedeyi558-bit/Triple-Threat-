/**
 * Normalize win_rate to a 0–100 display value.
 * Backend may return as a fraction (0–1) or already as percentage (0–100).
 * Every component that displays win_rate must use this function.
 */
export function normalizeWinRate(value: number | null | undefined): number | null {
  if (value == null) return null;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}
