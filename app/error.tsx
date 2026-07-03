'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">{error.message || 'An error occurred'}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
