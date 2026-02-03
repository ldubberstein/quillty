'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-6xl">😕</div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-500">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
