import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const statusStyles: Record<string, string> = {
  todo: "border-stone-300/70 bg-stone-100/70 text-stone-700",
  "in-progress": "border-sky-300/70 bg-sky-100/60 text-sky-800",
  done: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  pending: "border-amber-300/70 bg-amber-100/60 text-amber-900",
  paid: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  partial: "border-sky-300/70 bg-sky-100/60 text-sky-800",
  overdue: "border-rose-300/70 bg-rose-100/60 text-rose-800",
  cancelled: "border-stone-300/70 bg-stone-100/70 text-stone-700",
  new: "border-amber-300/70 bg-amber-100/60 text-amber-900",
  contacted: "border-sky-300/70 bg-sky-100/60 text-sky-800",
  qualified: "border-violet-300/70 bg-violet-100/60 text-violet-800",
  converted: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  archived: "border-stone-300/70 bg-stone-100/70 text-stone-700",
  "to-review": "border-amber-300/70 bg-amber-100/60 text-amber-900",
  "ready-to-contact": "border-sky-300/70 bg-sky-100/60 text-sky-800",
  responded: "border-violet-300/70 bg-violet-100/60 text-violet-800",
  "not-a-fit": "border-stone-300/70 bg-stone-100/70 text-stone-700",
  subscribed: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  unsubscribed: "border-stone-300/70 bg-stone-100/70 text-stone-700",
  ok: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  warning: "border-amber-300/70 bg-amber-100/60 text-amber-900",
  error: "border-rose-300/70 bg-rose-100/60 text-rose-800",
  failed: "border-rose-300/70 bg-rose-100/60 text-rose-800",
  sent: "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
  high: "border-rose-300/70 bg-rose-100/60 text-rose-800",
  normal: "border-amber-300/70 bg-amber-100/60 text-amber-900",
  low: "border-stone-300/70 bg-stone-100/70 text-stone-700",
  "due-overdue": "border-rose-300/70 bg-rose-100/60 text-rose-800",
  "due-soon": "border-rose-200/70 bg-rose-50/80 text-rose-700",
  "due-later": "border-stone-300/70 bg-stone-100/70 text-stone-700",
  "due-done": "border-emerald-300/70 bg-emerald-100/60 text-emerald-800",
};

function defaultLabel(status: string) {
  return status.replaceAll("-", " ");
}

export default function RecordBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        statusStyles[status] ?? statusStyles.todo,
        className,
      )}
    >
      {label ?? defaultLabel(status)}
    </span>
  );
}
