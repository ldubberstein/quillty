export function FollowListSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div>
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                <div className="mt-1 h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
