export type DeleteMode = "soft" | "permanent";

export function getDeleteMode(request: Request): DeleteMode | null {
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === null || mode === "soft") return "soft";
  return mode === "permanent" ? "permanent" : null;
}
