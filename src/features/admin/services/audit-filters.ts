export function parseAuditDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function escapeAuditSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
