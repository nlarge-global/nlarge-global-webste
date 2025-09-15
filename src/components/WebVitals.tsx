"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackWebVitals } from "@/utils/performance";

export function WebVitals() {
  useReportWebVitals((metric) => {
    trackWebVitals({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    });
  });

  return null;
}
