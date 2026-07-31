/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve/reject within `ms` milliseconds,
 * it rejects with a "slow connection" error.
 *
 * Use on any async action that involves a network request to prevent
 * indefinite spinners and to stop double-submission.
 *
 * Usage:
 *   const result = await withTimeout(walletApi.deposit(amt), 18000);
 */
export function withTimeout<T>(promise: Promise<T>, ms = 18000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Taking longer than usual — check your connection and try again"));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}
