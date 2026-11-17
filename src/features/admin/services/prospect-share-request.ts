export function isAllowedShareTargetRequest(request: Request, appOrigin: string) {
  const fetchSite = request.headers.get("sec-fetch-site");
  const isTopLevelNavigation =
    request.headers.get("sec-fetch-mode") === "navigate" &&
    request.headers.get("sec-fetch-dest") === "document";

  // shortcut: cross-site share navigations may only stage a draft; saving requires same-origin CSRF validation.
  if (fetchSite === "cross-site") return isTopLevelNavigation;

  const origin = request.headers.get("origin");
  return !origin || new URL(origin).origin === appOrigin;
}
