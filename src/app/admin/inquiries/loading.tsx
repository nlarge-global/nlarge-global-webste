export default function Loading() {
  return (
    <div>
      <header className="border-b border-black/10 pb-6">
        <div className="h-9 w-40 animate-pulse rounded bg-black/10 motion-reduce:animate-none sm:h-10" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      </header>
      <section
        aria-busy="true"
        aria-label="Loading inquiries"
        className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white"
        role="status"
      >
        <span className="sr-only">Loading inquiries</span>
        <div aria-hidden="true" className="divide-y divide-black/10">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="space-y-3 p-4 sm:px-5">
              <div className="flex flex-wrap gap-2">
                <div className="h-5 w-2/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-black/10 motion-reduce:animate-none" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-black/10 motion-reduce:animate-none" />
              </div>
              <div className="h-4 w-1/3 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="flex justify-center gap-1 border-t border-black/10 p-4"
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
