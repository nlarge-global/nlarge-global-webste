export type ArchiveFilter = "active" | "archived" | "all";

export function parseArchiveFilter(value?: string | null): ArchiveFilter {
  return value === "archived" || value === "all" ? value : "active";
}

export function getArchiveQuery(filter: ArchiveFilter): Record<string, unknown> {
  if (filter === "active") return { deletedAt: { $exists: false } };
  if (filter === "archived") return { deletedAt: { $exists: true } };
  return {};
}

export function includesArchived(filter: ArchiveFilter) {
  return filter !== "active";
}
