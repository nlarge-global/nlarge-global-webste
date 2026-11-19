export type DueDateState = "overdue" | "today" | "soon" | "later";

function dateParts(value: string | Date) {
  if (value instanceof Date && Number.isNaN(value.getTime())) return null;
  const isDateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = value instanceof Date
    ? value
    : isDateOnly
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (!year || !month || !day) return null;
  if (
    isDateOnly &&
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` !== value
  ) {
    return null;
  }
  return { year, month, day };
}

export function getDueDateState(
  dateValue: string | Date | null | undefined,
  now = new Date(),
): DueDateState | null {
  if (!dateValue) return null;
  const parts = dateParts(dateValue);
  if (!parts) return null;
  if (
    dateValue instanceof Date ||
    (typeof dateValue === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(dateValue))
  ) {
    const dueAt = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (dueAt.getTime() < now.getTime()) return "overdue";
  }
  const { year, month, day } = parts;
  const dueDay = new Date(year, month - 1, day).getTime();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysUntilDue = Math.round((dueDay - todayDay) / 86_400_000);
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 0) return "today";
  if (daysUntilDue <= 3) return "soon";
  return "later";
}
