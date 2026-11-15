import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 py-20 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#602329]">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Page not found</h1>
        <p className="mt-3 max-w-md text-black/55">The page you requested does not exist or is no longer available.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-[#602329] underline underline-offset-4">Return home</Link>
      </div>
    </main>
  );
}
