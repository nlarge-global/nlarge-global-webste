export function isAllowedShareTargetRequest(request: Request, appOrigin: string) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const isTopLevelNavigation =
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document";

  // Share navigation headers identify a draft-only request; confirmation separately enforces same-origin CSRF.
  if (isTopLevelNavigation && (fetchSite === "cross-site" || fetchSite === "none")) {
    return true;
  }
  if (fetchSite === "cross-site" || fetchSite === "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === appOrigin;
  } catch {
    return false;
  }
}
