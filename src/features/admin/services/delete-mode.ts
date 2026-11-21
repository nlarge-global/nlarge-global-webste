export type DeleteMode = "soft" | "permanent";
export type RecordActionMode = DeleteMode | "restore";

export function getRecordActionMode(request: Request): RecordActionMode | null {
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === null || mode === "soft") return "soft";
  return mode === "permanent" || mode === "restore" ? mode : null;
}

export function getDeleteMode(request: Request): DeleteMode | null {
  const mode = getRecordActionMode(request);
  return mode === "restore" ? null : mode;
}
