export const operationCategories = [
  "security",
  "data-access",
  "data-integrity",
  "availability",
  "application",
] as const;
export const operationSeverities = ["critical", "high", "medium", "low"] as const;

export type OperationCategory = (typeof operationCategories)[number];
export type OperationSeverity = (typeof operationSeverities)[number];
