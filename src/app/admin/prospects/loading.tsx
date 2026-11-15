export default function ProspectsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading prospects" className="mx-auto max-w-6xl animate-pulse space-y-6">
      <div className="h-10 w-48 rounded-lg bg-black/10" />
      <div className="h-5 max-w-xl rounded bg-black/10" />
      <div className="h-14 rounded-xl bg-black/10" />
      <div className="h-16 rounded-xl bg-black/10" />
      <div className="space-y-3 rounded-2xl border border-black/10 p-5">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 rounded-xl bg-black/10" />)}
      </div>
    </div>
  );
}
