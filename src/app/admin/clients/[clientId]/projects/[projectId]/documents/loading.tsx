export default function Loading() {
  return (
    <div>
      <header className="border-b border-black/10 pb-5">
        <div className="h-10 w-44 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </header>
      <section
        aria-busy="true"
        aria-label="Loading project documents"
        className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
        role="status"
      >
        <span className="sr-only">Loading project documents</span>
        <div aria-hidden="true" className="divide-y divide-black/10">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 py-5">
              <div className="size-11 shrink-0 animate-pulse rounded-xl bg-black/10 motion-reduce:animate-none" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
