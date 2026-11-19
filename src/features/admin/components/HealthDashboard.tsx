"use client";

import { useEffect, useState } from "react";
import { getDisplayErrorMessage } from "@/lib/error-message";
import { Card } from "@/components/ui/card";
import RecordBadge from "@/features/admin/components/RecordBadge";
import {
  HEALTH_CHECK_NAMES,
  type HealthCheck,
  type HealthCheckName,
} from "@/features/admin/services/health-types";

const loadingMessage = "Checking service…";

export default function HealthDashboard() {
  const [checks, setChecks] = useState<Partial<Record<HealthCheckName, HealthCheck>>>({});

  useEffect(() => {
    const controller = new AbortController();
    for (const name of HEALTH_CHECK_NAMES) {
      void fetch(`/api/admin/health?check=${name}`, { signal: controller.signal })
        .then(async (response) => {
          const result = await response.json() as { check?: HealthCheck; error?: string };
          if (!response.ok || !result.check) {
            throw new Error(result.error ?? `Unable to check ${name}.`);
          }
          setChecks((current) => ({ ...current, [name]: result.check }));
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setChecks((current) => ({
            ...current,
            [name]: {
              status: "error",
              message: getDisplayErrorMessage(error, `Unable to check ${name}.`),
            },
          }));
        });
    }
    return () => controller.abort();
  }, []);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-live="polite">
      {HEALTH_CHECK_NAMES.map((name) => {
        const check = checks[name];
        return (
          <Card key={name} className="min-h-32 p-5" aria-busy={!check}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold capitalize">{name}</h2>
              {check ? (
                <RecordBadge status={check.status} />
              ) : (
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs text-black/50">
                  Checking
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-6 text-black/55">
              {check?.message ?? loadingMessage}
            </p>
            {check?.details && (
              <pre
                aria-label={`${name} error details`}
                className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-5 whitespace-pre-wrap break-words text-slate-100"
                tabIndex={0}
              >
                <code>{check.details}</code>
              </pre>
            )}
          </Card>
        );
      })}
    </div>
  );
}
