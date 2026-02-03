export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Quillty</h1>
        <p className="mb-8 text-lg text-gray-600">
          Discover & create quilting patterns
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/feed"
            className="touch-target inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Explore Patterns
          </a>
          <a
            href="/signup"
            className="touch-target inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
