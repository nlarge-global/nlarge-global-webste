export function getDisplayErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "development") return fallback;
  return error instanceof Error ? error.message : String(error);
}
