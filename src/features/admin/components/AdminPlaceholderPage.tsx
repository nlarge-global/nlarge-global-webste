import { FiCheckCircle, FiInfo, FiLoader, FiSearch } from "react-icons/fi";
import { AdminBreadcrumbs } from "./AdminShell";
import HelpTooltip from "./HelpTooltip";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
};

export default function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div>
      <AdminBreadcrumbs current={title} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#602329]">Admin foundation</p>
          <div className="flex items-center gap-2">
            <h1 data-tour="admin-overview" className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
            <HelpTooltip label={`${title} help`}>
              This area will explain the purpose of the page and the decisions that matter when its data is connected.
            </HelpTooltip>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">{description}</p>
        </div>
        <button type="button" disabled className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white opacity-45">
          Add {title === "Overview" ? "item" : title.slice(0, -1)}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["Total", "Needs attention", "This month", "Completed"].map((label, index) => (
          <section key={label} className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
            <p className="text-sm text-black/50">{label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="h-8 w-16 animate-pulse rounded-lg bg-black/[0.07] motion-reduce:animate-none" />
              {index === 0 && <FiLoader aria-label="Loading" className="size-4 animate-spin text-black/30 motion-reduce:animate-none" />}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-black/50">Data and actions will appear here when this feature is connected.</p>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 px-3 text-sm text-black/45">
            <FiSearch aria-hidden="true" />
            <span className="sr-only">Search</span>
            <input disabled placeholder="Search" className="w-24 bg-transparent outline-none placeholder:text-black/35" />
          </label>
        </div>
        <div className="grid min-h-56 place-items-center p-8 text-center">
          <div className="max-w-sm">
            <FiInfo aria-hidden="true" className="mx-auto size-7 text-[#602329]" />
            <h3 className="mt-3 font-semibold">No records yet</h3>
            <p className="mt-2 text-sm leading-6 text-black/50">This is a placeholder state for the visual foundation. Data will be added in later steps.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
          <FiInfo aria-hidden="true" className="mb-3 size-5" />
          <p className="font-semibold">Information state</p>
          <p className="mt-1 leading-6 text-blue-950/70">Helpful context will be shown here.</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
          <FiCheckCircle aria-hidden="true" className="mb-3 size-5" />
          <p className="font-semibold">Success state</p>
          <p className="mt-1 leading-6 text-emerald-950/70">Completed actions will be confirmed here.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <FiInfo aria-hidden="true" className="mb-3 size-5" />
          <p className="font-semibold">Error state</p>
          <p className="mt-1 leading-6 text-amber-950/70">Safe, actionable errors will be shown here.</p>
        </div>
      </div>
    </div>
  );
}
