"use client";

import { useEffect } from "react";

export default function OperationsErrorReporter() {
  useEffect(() => {
    const report = (
      event: "client.window_error" | "client.unhandled_rejection" | "client.api_error",
      error: unknown,
      details?: { route: string; method: string; status?: number },
    ) => {
      const message = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];

      void fetch("/api/admin/operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": decodeURIComponent(csrfToken) } : {}),
        },
        body: JSON.stringify({
          event,
          route: details?.route ?? window.location.pathname,
          method: details?.method ?? "CLIENT",
          status: details?.status,
          message: message.slice(0, 1000),
          errorName,
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    const onError = (event: ErrorEvent) => {
      if (event.error instanceof Error) report("client.window_error", event.error);
      else report("client.window_error", new Error(event.message || "Uncaught browser error"));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      report("client.unhandled_rejection", event.reason);
    };
    const originalFetch = window.fetch.bind(window);
    const xhrRequests = new WeakMap<XMLHttpRequest, { route: string; method: string }>();
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null,
    ) {
      try {
        const parsedUrl = new URL(String(url), window.location.href);
        xhrRequests.set(this, { route: parsedUrl.pathname, method: method.toUpperCase() });
      } catch {
        xhrRequests.set(this, { route: "", method: method.toUpperCase() });
      }
      return Reflect.apply(
        originalOpen,
        this,
        async === undefined
          ? [method, url]
          : [method, url, async, username ?? null, password ?? null],
      );
    };
    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener("load", () => {
        const details = xhrRequests.get(this);
        if (
          this.status >= 500 &&
          details?.route.startsWith("/api/admin/") &&
          details.route !== "/api/admin/operations"
        ) {
          report(
            "client.api_error",
            new Error(`Admin API returned HTTP ${this.status}`),
            { ...details, status: this.status },
          );
        }
      }, { once: true });
      this.addEventListener("error", () => {
        const details = xhrRequests.get(this);
        if (
          details?.route.startsWith("/api/admin/") &&
          details.route !== "/api/admin/operations"
        ) {
          report(
            "client.api_error",
            new Error("Admin API request failed before receiving a response."),
            details,
          );
        }
      }, { once: true });
      return originalSend.call(this, body);
    };
    window.fetch = async (...args) => {
      const input = args[0];
      const url = input instanceof Request
        ? new URL(input.url)
        : new URL(input instanceof URL ? input.href : String(input), window.location.href);
      const requestMethod = (args[1]?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      const method = ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(requestMethod)
        ? requestMethod
        : "GET";
      try {
        const response = await originalFetch(...args);
        if (
          response.status >= 500 &&
          url.origin === window.location.origin &&
          url.pathname.startsWith("/api/admin/") &&
          url.pathname !== "/api/admin/operations"
        ) {
          void response.clone().json().then((result: { referenceId?: string }) => {
            if (result.referenceId) return;
            report("client.api_error", new Error(`Admin API returned HTTP ${response.status}`), {
              route: url.pathname,
              method,
              status: response.status,
            });
          }).catch(() => {
            report("client.api_error", new Error(`Admin API returned HTTP ${response.status}`), {
              route: url.pathname,
              method,
              status: response.status,
            });
          });
        }
        return response;
      } catch (error) {
        if (
          !(error instanceof DOMException && error.name === "AbortError") &&
          url.origin === window.location.origin &&
          url.pathname.startsWith("/api/admin/") &&
          url.pathname !== "/api/admin/operations"
        ) {
          report(
            "client.api_error",
            new Error("Admin API request failed before receiving a response."),
            { route: url.pathname, method },
          );
        }
        throw error;
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalOpen;
      XMLHttpRequest.prototype.send = originalSend;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
