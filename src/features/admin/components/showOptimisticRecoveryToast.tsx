"use client";

import { toast } from "sonner";

const RECOVERY_DELAY_MS = 5000;

export function showOptimisticRecoveryToast(
  message: string,
  onRecover: () => void,
) {
  const toastId = toast.custom(
    () => (
      <div
        role="alert"
        className="flex min-w-72 items-center justify-between gap-4 rounded-xl border border-red-900/15 bg-[#fffdfb] px-4 py-3 text-sm text-[#602329] shadow-lg"
      >
        <div>
          <p className="font-semibold">{message}</p>
          <p className="mt-1 text-xs text-black/60">Reopening the form in 5 seconds.</p>
        </div>
        <svg
          aria-label="Reopening in five seconds"
          role="img"
          viewBox="0 0 32 32"
          className="recovery-toast-countdown size-8 shrink-0"
        >
          <circle
            cx="16"
            cy="16"
            r="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="81.7"
          />
        </svg>
      </div>
    ),
    { duration: Number.POSITIVE_INFINITY },
  );

  window.setTimeout(() => {
    toast.dismiss(toastId);
    onRecover();
  }, RECOVERY_DELAY_MS);
}
