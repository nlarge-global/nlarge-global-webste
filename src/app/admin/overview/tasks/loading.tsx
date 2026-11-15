export default function Loading() {
  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-9 w-36 animate-pulse rounded bg-black/10 motion-reduce:animate-none sm:h-10" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </header>

      <section
        aria-busy="true"
        aria-label="Loading tasks"
        className="mt-3 flex h-[calc(100dvh-20rem)] min-h-56 flex-col overflow-hidden sm:h-[calc(100dvh-12rem)]"
        role="status"
      >
        <span className="sr-only">Loading tasks</span>
        <div
          aria-hidden="true"
          className="min-h-0 flex-1 space-y-3 overflow-hidden"
        >
          <div className="h-5 w-28 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border border-black/10 bg-[#f6f6f6] p-3"
              >
                <div className="h-6 w-3/4 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 animate-pulse rounded-sm bg-black/10 motion-reduce:animate-none" />
                  <div className="h-6 w-20 animate-pulse rounded-sm bg-black/10 motion-reduce:animate-none" />
                </div>
                <div className="h-4 w-2/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 justify-center gap-1 border-t border-black/10 p-4"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="size-10 animate-pulse rounded bg-black/10 motion-reduce:animate-none"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
