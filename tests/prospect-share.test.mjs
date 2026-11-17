import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedShareTargetRequest } from "../src/features/admin/services/prospect-share-request.ts";
import {
  extractSharedUrl,
  sourceFromProspectUrl,
} from "../src/features/admin/services/prospect-url.ts";

const appOrigin = "https://admin.example.com";

test("allows a cross-site top-level navigation for an installed share target", () => {
  const request = new Request(`${appOrigin}/api/admin/prospects/share`, {
    method: "POST",
    headers: {
      origin: "https://source.example",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    },
  });

  assert.equal(isAllowedShareTargetRequest(request, appOrigin), true);
});

test("allows a browser share navigation with opaque origin and fetch-site none", () => {
  const request = new Request(`${appOrigin}/api/admin/prospects/share`, {
    method: "POST",
    headers: {
      origin: "null",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-dest": "document",
    },
  });

  assert.equal(isAllowedShareTargetRequest(request, appOrigin), true);
});

test("rejects cross-site subrequests and mismatched non-navigation origins", () => {
  const subrequest = new Request(`${appOrigin}/api/admin/prospects/share`, {
    method: "POST",
    headers: { "sec-fetch-site": "cross-site", "sec-fetch-mode": "cors" },
  });
  const mismatchedOrigin = new Request(`${appOrigin}/api/admin/prospects/share`, {
    method: "POST",
    headers: { origin: "https://source.example", "sec-fetch-site": "same-site" },
  });

  assert.equal(isAllowedShareTargetRequest(subrequest, appOrigin), false);
  assert.equal(isAllowedShareTargetRequest(mismatchedOrigin, appOrigin), false);
});

test("rejects opaque origins on non-navigation requests", () => {
  const request = new Request(`${appOrigin}/api/admin/prospects/share`, {
    method: "POST",
    headers: {
      origin: "null",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });

  assert.equal(isAllowedShareTargetRequest(request, appOrigin), false);
});

test("accepts and classifies an Instagram share URL", () => {
  const url = "https://www.instagram.com/p/example/";
  const sharedUrl = extractSharedUrl(url, null);

  assert.equal(sharedUrl, url);
  assert.equal(sourceFromProspectUrl(sharedUrl), "instagram");
});
