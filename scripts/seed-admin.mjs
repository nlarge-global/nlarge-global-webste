import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const projectRoot = path.resolve(import.meta.dirname, "..");

function loadEnvFile(filename) {
  const file = path.resolve(projectRoot, filename);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const mongoUri = process.env.MONGODB_URI;
const masterKeyValue = process.env.MASTER_ENCRYPTION_KEY;
if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (!masterKeyValue) throw new Error("MASTER_ENCRYPTION_KEY is required to seed encrypted secrets.");
if (process.env.SEED_DEMO_DATA !== "YES") {
  throw new Error("Set SEED_DEMO_DATA=YES to confirm demo fixtures will be written.");
}
const seedDatabaseName = process.env.SEED_DATABASE_NAME;
if (!seedDatabaseName || !/(?:^|[-_])(dev|test|staging)(?:$|[-_])/i.test(seedDatabaseName)) {
  throw new Error("Set SEED_DATABASE_NAME to an isolated database name containing dev, test, or staging.");
}
const uriDatabaseName = decodeURIComponent(new URL(mongoUri).pathname.replace(/^\/+/, ""));
if (uriDatabaseName !== seedDatabaseName) {
  throw new Error("SEED_DATABASE_NAME must exactly match the database in MONGODB_URI.");
}

const masterKey = /^[a-f\d]{64}$/i.test(masterKeyValue)
  ? Buffer.from(masterKeyValue, "hex")
  : Buffer.from(masterKeyValue, "base64");
if (masterKey.length !== 32) throw new Error("MASTER_ENCRYPTION_KEY must encode exactly 32 bytes.");

const ids = {
  clientA: new mongoose.Types.ObjectId("65f000000000000000000001"),
  clientB: new mongoose.Types.ObjectId("65f000000000000000000002"),
  projectA: new mongoose.Types.ObjectId("65f000000000000000000011"),
  projectB: new mongoose.Types.ObjectId("65f000000000000000000012"),
  projectC: new mongoose.Types.ObjectId("65f000000000000000000013"),
  secretA: new mongoose.Types.ObjectId("65f000000000000000000021"),
  secretB: new mongoose.Types.ObjectId("65f000000000000000000022"),
  documentA: "seed-document-0001",
  paymentA: new mongoose.Types.ObjectId("65f000000000000000000041"),
  paymentB: new mongoose.Types.ObjectId("65f000000000000000000042"),
  inquiryA: new mongoose.Types.ObjectId("65f000000000000000000051"),
  inquiryB: new mongoose.Types.ObjectId("65f000000000000000000052"),
  taskA: new mongoose.Types.ObjectId("65f000000000000000000061"),
  taskB: new mongoose.Types.ObjectId("65f000000000000000000062"),
  taskC: new mongoose.Types.ObjectId("65f000000000000000000063"),
  prospectA: new mongoose.Types.ObjectId("65f000000000000000000071"),
  prospectB: new mongoose.Types.ObjectId("65f000000000000000000072"),
  conversationA: new mongoose.Types.ObjectId("65f000000000000000000081"),
  conversationB: new mongoose.Types.ObjectId("65f000000000000000000082"),
  subscriberA: new mongoose.Types.ObjectId("65f000000000000000000091"),
  subscriberB: new mongoose.Types.ObjectId("65f000000000000000000092"),
  subscriberC: new mongoose.Types.ObjectId("65f000000000000000000093"),
  auditA: new mongoose.Types.ObjectId("65f000000000000000000101"),
  auditB: new mongoose.Types.ObjectId("65f000000000000000000102"),
  operationsA: new mongoose.Types.ObjectId("65f000000000000000000111"),
  operationsB: new mongoose.Types.ObjectId("65f000000000000000000112"),
  emailA: new mongoose.Types.ObjectId("65f000000000000000000121"),
  emailB: new mongoose.Types.ObjectId("65f000000000000000000122"),
  settings: new mongoose.Types.ObjectId("65f000000000000000000131"),
};

function encrypt(value, key, keyVersion = "v1") {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion,
  };
}

function createClientKey() {
  const key = crypto.randomBytes(32);
  return {
    key,
    wrapped: encrypt(key.toString("base64"), masterKey, process.env.MASTER_ENCRYPTION_KEY_VERSION || "v1"),
  };
}

const now = new Date();
const daysFromNow = (days) => new Date(now.getTime() + days * 86_400_000);
const legalDocuments = JSON.parse(fs.readFileSync(
  path.resolve(projectRoot, "src/content/legal-documents.json"),
  "utf8",
));
const canonicalize = (value) => Array.isArray(value)
  ? `[${value.map(canonicalize).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(",")}}`
    : JSON.stringify(value) ?? "null";
const currentLegalVersion = (versions) => versions
  .filter((version) => Date.parse(version.effectiveAt) <= now.getTime())
  .sort((left, right) => Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt))[0];
const privacyPolicy = currentLegalVersion(legalDocuments.privacyPolicy);
const marketingConsent = currentLegalVersion(legalDocuments.marketingConsent);
if (!privacyPolicy || !Array.isArray(privacyPolicy.contactAcknowledgement) || !marketingConsent) {
  throw new Error("Current privacy and marketing consent wording is required for inquiry fixtures.");
}
const privacyAcknowledgementText = privacyPolicy.contactAcknowledgement
  .map((segment) => segment.text)
  .join("");
const privacyPolicyHash = crypto.createHash("sha256")
  .update(canonicalize(privacyPolicy))
  .digest("hex");
const createInquiryConsent = (withMarketing = false) => ({
  privacyAcknowledgement: {
    version: privacyPolicy.version,
    hash: privacyPolicyHash,
    text: privacyAcknowledgementText,
    acknowledgedAt: now,
    source: "seed-fixture",
  },
  ...(withMarketing ? {
    marketingSubscriptionRecordedAt: now,
    marketingConsent: {
      version: marketingConsent.version,
      text: marketingConsent.text,
      grantedAt: now,
      source: "seed-fixture",
    },
  } : {}),
});
const clientAKey = createClientKey();
const clientBKey = createClientKey();
const fixtureId = (prefix, index) => new mongoose.Types.ObjectId(`${prefix}${index.toString(16).padStart(18, "0")}`);
const longText = "Long-form fixture content for pagination, wrapping, keyboard navigation, and truncation checks. ".repeat(10).slice(0, 900);
const weirdText = "Edge case: café / 東京 / مرحبا / emoji 🚀 / quotes \" ' / <>& / tabs\tand newlines\ninside.";

const clients = [
  {
    _id: ids.clientA,
    name: "Aarav Mehta",
    email: "aarav@example.com",
    company: "Mehta Studio",
    phone: "+91 98765 43210",
    notes: "Primary contact for the studio website and brand refresh.",
    tags: ["website", "priority"],
    encryptedDataKey: clientAKey.wrapped.ciphertext,
    dataKeyIv: clientAKey.wrapped.iv,
    dataKeyAuthTag: clientAKey.wrapped.authTag,
    dataKeyVersion: clientAKey.wrapped.keyVersion,
  },
  {
    _id: ids.clientB,
    name: "Nisha Kapoor",
    email: "nisha@example.com",
    company: "Kapoor Foods",
    phone: "+91 99887 66554",
    notes: "Operations contact for the ordering portal.",
    tags: ["portal"],
    encryptedDataKey: clientBKey.wrapped.ciphertext,
    dataKeyIv: clientBKey.wrapped.iv,
    dataKeyAuthTag: clientBKey.wrapped.authTag,
    dataKeyVersion: clientBKey.wrapped.keyVersion,
  },
];

const projects = [
  {
    _id: ids.projectA,
    clientId: ids.clientA,
    name: "Mehta Studio Website",
    status: "in-progress",
    technicalDetails: "Next.js marketing site with CMS-ready content sections.",
    deliveryDetails: "Launch responsive pages, contact flow, and analytics handoff.",
    environment: "Production",
    productionUrl: "https://studio.example.com",
    stagingUrl: "https://staging.studio.example.com",
    deadline: daysFromNow(21),
    notes: "Use the approved wine-red visual system.",
  },
  {
    _id: ids.projectB,
    clientId: ids.clientA,
    name: "Brand Refresh",
    status: "todo",
    technicalDetails: "Visual identity and reusable presentation templates.",
    deliveryDetails: "Deliver final logo exports and social templates.",
    environment: "Discovery",
    deadline: daysFromNow(45),
  },
  {
    _id: ids.projectC,
    clientId: ids.clientB,
    name: "Kapoor Foods Ordering Portal",
    status: "in-progress",
    technicalDetails: "Authenticated ordering portal with operational dashboard.",
    deliveryDetails: "Complete checkout, order tracking, and staff handoff.",
    environment: "Staging",
    stagingUrl: "https://staging.kapoor.example.com",
    deadline: daysFromNow(12),
  },
];

const secrets = [
  (() => {
    const encrypted = encrypt("demo-api-key-mehta", clientAKey.key);
    return { _id: ids.secretA, clientId: ids.clientA, projectId: ids.projectA, label: "Staging API key", type: "api-key", encryptedValue: encrypted.ciphertext, iv: encrypted.iv, authTag: encrypted.authTag, keyVersion: encrypted.keyVersion, expiresAt: daysFromNow(90) };
  })(),
  (() => {
    const encrypted = encrypt("demo-portal-token-kapoor", clientBKey.key);
    return { _id: ids.secretB, clientId: ids.clientB, projectId: ids.projectC, label: "Portal integration token", type: "token", encryptedValue: encrypted.ciphertext, iv: encrypted.iv, authTag: encrypted.authTag, keyVersion: encrypted.keyVersion, expiresAt: daysFromNow(120) };
  })(),
];

const documents = [
  {
    _id: ids.documentA,
    clientId: ids.clientA,
    projectId: ids.projectA,
    filename: "mehta-studio-brief.pdf",
    tags: ["fixture"],
    objectKey: `clients/${ids.clientA}/documents/${ids.documentA}/mehta-studio-brief.pdf`,
    contentType: "application/pdf",
    size: 245_760,
  },
];

const payments = [
  { _id: ids.paymentA, clientId: ids.clientA, projectId: ids.projectA, amount: 125000, currency: "INR", method: "bank-transfer", status: "paid", milestone: "Project kickoff", paidAt: daysFromNow(-8), utrReference: "DEMO-UTR-001", notes: "Seeded demo payment." },
  { _id: ids.paymentB, clientId: ids.clientB, projectId: ids.projectC, amount: 1800, currency: "USD", method: "card", status: "pending", milestone: "Staging approval", notes: "Awaiting client approval." },
];

const inquiries = [
  { _id: ids.inquiryA, name: "Aarav Mehta", email: "aarav@example.com", queryType: "business", subject: "Website launch follow-up", message: "Can we review the launch checklist this week?", ...createInquiryConsent(true), origin: "public", source: "website", status: "converted", priority: "high", tags: ["website"], clientId: ids.clientA, idempotencyKey: "seed-inquiry-a" },
  { _id: ids.inquiryB, name: "Nisha Kapoor", email: "nisha@example.com", queryType: "support", subject: "Portal staging review", message: "The staging review is ready to schedule.", ...createInquiryConsent(), origin: "public", source: "referral", status: "in-progress", priority: "normal", tags: ["portal"], clientId: ids.clientB, idempotencyKey: "seed-inquiry-b" },
];

const tasks = [
  { _id: ids.taskA, clientId: ids.clientA, projectId: ids.projectA, title: "Review responsive launch checklist", status: "in-progress", priority: "high", dueDate: daysFromNow(3), notes: "Check mobile navigation, forms, and metadata." },
  { _id: ids.taskB, clientId: ids.clientA, projectId: ids.projectB, title: "Approve final brand exports", status: "todo", priority: "normal", dueDate: null },
  { _id: ids.taskC, clientId: ids.clientB, projectId: ids.projectC, title: "Test staff order workflow", status: "done", priority: "normal", dueDate: daysFromNow(-2), completedAt: daysFromNow(-3) },
];

const conversations = [
  { _id: ids.conversationA, inquiryId: ids.inquiryA, channel: "email", direction: "inbound", content: "Could we confirm the responsive review before launch?", occurredAt: daysFromNow(-2) },
  { _id: ids.conversationB, inquiryId: ids.inquiryB, channel: "internal-note", direction: "internal", content: "Prepare the staging checklist before scheduling the review.", occurredAt: daysFromNow(-1) },
];

const subscribers = [
  {
    _id: ids.subscriberA,
    email: "aarav@example.com",
    unsubscribeKey: crypto.randomBytes(32).toString("base64url"),
    status: "subscribed",
    consentEvents: [{
      action: "granted",
      version: marketingConsent.version,
      text: marketingConsent.text,
      occurredAt: now,
      source: "seed-fixture",
      sourceId: String(ids.inquiryA),
    }],
  },
  {
    _id: ids.subscriberB,
    email: "fixture.subscriber@example.test",
    unsubscribeKey: crypto.randomBytes(32).toString("base64url"),
    status: "subscribed",
    consentEvents: [{
      action: "granted",
      version: marketingConsent.version,
      text: marketingConsent.text,
      occurredAt: daysFromNow(-4),
      source: "seed-fixture",
      sourceId: "seed-fixture-subscriber-b",
    }],
  },
  {
    _id: ids.subscriberC,
    email: "fixture.withdrawn@example.test",
    unsubscribeKey: crypto.randomBytes(32).toString("base64url"),
    status: "unsubscribed",
    unsubscribedAt: daysFromNow(-1),
    consentEvents: [
      {
        action: "granted",
        version: marketingConsent.version,
        text: marketingConsent.text,
        occurredAt: daysFromNow(-8),
        source: "seed-fixture",
        sourceId: "seed-fixture-subscriber-c",
      },
      {
        action: "withdrawn",
        version: marketingConsent.withdrawalVersion,
        text: marketingConsent.withdrawalText,
        occurredAt: daysFromNow(-1),
        source: "seed-fixture",
      },
    ],
  },
];

const prospects = [
  { _id: ids.prospectA, name: "Fixture Prospect — Northstar", url: "https://northstar.example.test", source: "website", notes: "Seeded prospect for list and detail checks.", status: "ready-to-contact", nextAction: "Prepare an introduction.", followUpAt: daysFromNow(3) },
  { _id: ids.prospectB, name: "Fixture Prospect — Riverside", url: "https://riverside.example.test", source: "referral", notes: "Seeded prospect with a completed follow-up.", status: "contacted", nextAction: "Wait for a response.", followUpAt: daysFromNow(-2) },
];
const prospectActivities = [
  { _id: new mongoose.Types.ObjectId("65f000000000000000000073"), prospectId: ids.prospectA, type: "note", content: "Added from the demo seed.", occurredAt: daysFromNow(-2) },
  { _id: new mongoose.Types.ObjectId("65f000000000000000000074"), prospectId: ids.prospectA, type: "email", content: "Sent a sample introductory email.", occurredAt: daysFromNow(-1) },
  { _id: new mongoose.Types.ObjectId("65f000000000000000000075"), prospectId: ids.prospectB, type: "call", content: "Logged a sample follow-up call.", occurredAt: daysFromNow(-4) },
];

const auditEvents = [
  { _id: ids.auditA, actor: "admin", action: "client.created", resourceType: "client", resourceId: String(ids.clientA), resourceLabel: "Aarav Mehta", requestId: "seed-audit-client-created", metadata: { source: "seed-fixture", status: "active" }, createdAt: daysFromNow(-3) },
  { _id: ids.auditB, actor: "public", action: "inquiry.created", resourceType: "inquiry", resourceId: String(ids.inquiryA), resourceLabel: "Website launch follow-up", requestId: "seed-audit-inquiry-created", metadata: { source: "seed-fixture", status: "new" }, createdAt: daysFromNow(-1) },
];

const operationsEvents = [
  { _id: ids.operationsA, category: "availability", severity: "medium", event: "admin.action.failed", source: "server", route: "/api/admin/projects", method: "GET", status: 500, message: "Seeded example server failure.", errorName: "ExampleError", stack: "ExampleError: Seeded example server failure.", requestId: "seed-operations-001", ipAddress: "192.0.2.10", userAgent: "Seed Fixture Browser", occurrences: 2, lastSeenAt: daysFromNow(-1), createdAt: daysFromNow(-2) },
  { _id: ids.operationsB, category: "security", severity: "high", event: "admin.login.failed", source: "server", route: "/api/admin/auth/login", method: "POST", status: 401, message: "Seeded example login failure.", errorName: "AuthenticationError", requestId: "seed-operations-002", ipAddress: "198.51.100.15", userAgent: "Seed Fixture Browser", occurrences: 1, lastSeenAt: daysFromNow(-1), createdAt: daysFromNow(-1) },
];

const emailRecords = [
  { _id: ids.emailA, inquiryId: ids.inquiryA, direction: "outbound", recipient: "aarav@example.com", subject: "Re: Website launch follow-up", status: "sent", sentAt: daysFromNow(-2) },
  { _id: ids.emailB, inquiryId: ids.inquiryB, direction: "outbound", recipient: "nisha@example.com", subject: "Portal staging review", status: "failed" },
];

const settings = [{
  _id: ids.settings,
  key: "dashboard",
  displayName: "NLarge Admin",
  timezone: "Asia/Kolkata",
  dateFormat: "dd MMM yyyy",
  emailSignature: "NLarge Global Demo",
  defaultReplyTemplate: "Thank you for your message. This is a seeded reply template for testing.",
}];

const generatedClients = [];
const generatedProjects = [];
const generatedSecrets = [];
const generatedDocuments = [];
const generatedPayments = [];
const generatedInquiries = [];
const generatedTasks = [];
const generatedProspects = [];
const generatedProspectActivities = [];
const generatedConversations = [];
const generatedAuditEvents = [];
const generatedOperationsEvents = [];
const generatedClientKeys = new Map([
  [String(ids.clientA), clientAKey],
  [String(ids.clientB), clientBKey],
]);

for (let index = 1; index <= 30; index += 1) {
  const clientId = fixtureId("66a000", index);
  const key = createClientKey();
  generatedClientKeys.set(String(clientId), key);
  generatedClients.push({
    _id: clientId,
    name: index % 5 === 0 ? `Client ${index} — ${weirdText.slice(0, 20)}` : `Fixture Client ${String(index).padStart(2, "0")}`,
    email: `fixture.client.${index}@example.test`,
    company: index % 4 === 0 ? `Very Long Company Name ${index} ${"North ".repeat(8)}`.slice(0, 150) : `Fixture Company ${index}`,
    phone: index % 3 === 0 ? `+91 90000 ${String(index).padStart(5, "0")}` : undefined,
    notes: index % 6 === 0 ? longText : index % 7 === 0 ? weirdText : `Generated client record ${index}.`,
    tags: index % 5 === 0 ? ["long-tag-value", "edge-case", "priority"] : ["fixture"],
    encryptedDataKey: key.wrapped.ciphertext,
    dataKeyIv: key.wrapped.iv,
    dataKeyAuthTag: key.wrapped.authTag,
    dataKeyVersion: key.wrapped.keyVersion,
  });
  for (let projectIndex = 1; projectIndex <= 2; projectIndex += 1) {
    const projectId = fixtureId("66b000", (index - 1) * 2 + projectIndex);
    generatedProjects.push({
      _id: projectId,
      clientId,
      name: projectIndex === 2 && index % 5 === 0 ? `${"A very long project name ".repeat(6)}${index}`.slice(0, 150) : `Fixture Project ${index}.${projectIndex}`,
      status: ["todo", "in-progress", "done"][(index + projectIndex) % 3],
      technicalDetails: index % 4 === 0 ? longText : `Technical fixture notes for client ${index}.`,
      deliveryDetails: index % 3 === 0 ? weirdText : "Delivery checklist and handoff notes.",
      environment: ["Development", "Staging", "Production", "Discovery"][index % 4],
      deadline: daysFromNow(index % 2 === 0 ? index - 15 : -index),
      notes: index % 8 === 0 ? longText : undefined,
    });
    const projectKey = generatedClientKeys.get(String(clientId));
    for (let taskIndex = 1; taskIndex <= 3; taskIndex += 1) {
      generatedTasks.push({
        _id: fixtureId("66c000", (index - 1) * 6 + (projectIndex - 1) * 3 + taskIndex),
        clientId,
        projectId,
        title: taskIndex === 3 && index % 6 === 0 ? longText.slice(0, 200) : `Fixture task ${index}.${projectIndex}.${taskIndex}`,
        status: ["todo", "in-progress", "done"][(index + taskIndex) % 3],
        priority: ["low", "normal", "high"][(index + projectIndex + taskIndex) % 3],
        dueDate: index % 8 === 0 ? null : daysFromNow(index % 9 === 0 ? -index : index + taskIndex),
        notes: index % 5 === 0 ? weirdText : undefined,
        completedAt: (index + taskIndex) % 3 === 0 ? daysFromNow(-taskIndex) : undefined,
      });
    }
    if (projectKey) {
      for (let secretIndex = 1; secretIndex <= 3; secretIndex += 1) {
        const encrypted = encrypt(index % 4 === 0 ? weirdText : `fixture-secret-${index}-${secretIndex}`, projectKey.key);
        generatedSecrets.push({
          _id: fixtureId("66d000", (index - 1) * 6 + (projectIndex - 1) * 3 + secretIndex),
          clientId,
          projectId,
          label: secretIndex === 3 && index % 5 === 0 ? `Secret with an unusually long label ${"x".repeat(90)}`.slice(0, 150) : `Fixture ${["API key", "Token", "Password"][secretIndex - 1]} ${index}.${projectIndex}`,
          type: ["api-key", "token", "username-password"][secretIndex - 1],
          encryptedValue: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: encrypted.keyVersion,
          expiresAt: daysFromNow(index % 4 === 0 ? -index : index + secretIndex * 10),
        });
      }
      generatedDocuments.push({
        _id: `fixture-document-${index}-${projectIndex}`,
        clientId,
        projectId,
        filename: index % 5 === 0 ? `fixture file ${index} — weird & long name.pdf` : `fixture-${index}-${projectIndex}.pdf`,
        tags: ["fixture"],
        description: index % 4 === 0 ? longText : index % 3 === 0 ? weirdText : `Fixture document ${index}.${projectIndex}`,
        objectKey: `fixtures/${clientId}/documents/${projectId}.pdf`,
        contentType: "application/pdf",
        size: 1024 + index * 4096,
      });
      generatedPayments.push({
        _id: fixtureId("66f000", (index - 1) * 2 + projectIndex),
        clientId,
        projectId,
        amount: index % 7 === 0 ? 0.01 : index * 1375.5,
        currency: ["INR", "USD", "EUR", "GBP"][index % 4],
        method: ["bank-transfer", "card", "cash", "other"][index % 4],
        status: ["pending", "paid", "partial", "overdue", "cancelled"][index % 5],
        milestone: index % 5 === 0 ? longText.slice(0, 150) : `Fixture milestone ${index}.${projectIndex}`,
        notes: index % 6 === 0 ? weirdText : `Generated payment ${index}.${projectIndex}.`,
        paidAt: index % 5 === 1 ? daysFromNow(-index) : undefined,
      });
    }
  }
  generatedInquiries.push({
    _id: fixtureId("670000", index),
    name: index % 5 === 0 ? `Person ${index} — 東京` : `Fixture Enquirer ${index}`,
    email: `fixture.inquiry.${index}@example.test`,
    queryType: ["general", "support", "business", "careers"][index % 4],
    subject: index % 6 === 0 ? longText.slice(0, 100) : `Fixture inquiry subject ${index}`,
    message: index % 4 === 0 ? longText : weirdText,
    ...createInquiryConsent(index % 5 === 0),
    origin: "public",
    source: ["website", "whatsapp", "linkedin", "call", "friend", "personal", "referral", "other"][index % 8],
    status: ["new", "in-progress", "converted", "archived"][index % 4],
    priority: ["low", "normal", "high"][index % 3],
    tags: index % 5 === 0 ? ["fixture", "long-tag", "weird-data"] : ["fixture"],
    nextAction: index % 3 === 0 ? weirdText.slice(0, 500) : undefined,
    followUpAt: daysFromNow(index - 15),
    clientId: index % 4 === 0 ? generatedClients[index - 1]._id : undefined,
    idempotencyKey: `seed-fixture-inquiry-${index}`,
  });
  const generatedInquiryId = fixtureId("670000", index);
  generatedConversations.push(
    {
      _id: fixtureId("672000", (index - 1) * 2 + 1),
      inquiryId: generatedInquiryId,
      channel: "email",
      direction: "inbound",
      content: `Seeded customer message for inquiry ${index}.`,
      occurredAt: daysFromNow(-index),
    },
    {
      _id: fixtureId("672000", (index - 1) * 2 + 2),
      inquiryId: generatedInquiryId,
      channel: "internal-note",
      direction: "internal",
      content: `Seeded internal follow-up note for inquiry ${index}.`,
      occurredAt: daysFromNow(-Math.max(index - 1, 0)),
    },
  );
  const prospectId = fixtureId("671000", index);
  generatedProspects.push({
    _id: prospectId,
    name: index % 4 === 0 ? `Fixture Prospect ${index} — 東京` : `Fixture Prospect ${String(index).padStart(2, "0")}`,
    url: `https://fixture-prospect-${index}.example.test`,
    source: ["google-maps", "instagram", "linkedin", "website", "referral", "call", "other"][index % 7],
    notes: index % 5 === 0 ? longText : `Seeded prospect ${index} for list and search testing.`,
    status: ["to-review", "ready-to-contact", "contacted", "responded", "converted", "not-a-fit"][index % 6],
    nextAction: index % 3 === 0 ? "Review the sample follow-up." : undefined,
    followUpAt: daysFromNow(index - 15),
  });
  generatedProspectActivities.push(
    {
      _id: fixtureId("674000", (index - 1) * 2 + 1),
      prospectId,
      type: "note",
      content: `Seeded activity note ${index}.`,
      occurredAt: daysFromNow(-index),
    },
    {
      _id: fixtureId("674000", (index - 1) * 2 + 2),
      prospectId,
      type: ["call", "email", "message", "meeting", "status-change"][index % 5],
      content: `Seeded follow-up activity ${index}.`,
      occurredAt: daysFromNow(-Math.max(index - 1, 0)),
    },
  );
  generatedAuditEvents.push({
    _id: fixtureId("675000", index),
    actor: index % 4 === 0 ? "public" : "admin",
    action: ["client.updated", "project.created", "task.updated", "inquiry.created"][index % 4],
    resourceType: ["client", "project", "task", "inquiry"][index % 4],
    resourceId: String(generatedInquiryId),
    resourceLabel: `Seed fixture ${index}`,
    requestId: `seed-audit-fixture-${index}`,
    metadata: { source: "seed-fixture", status: ["new", "in-progress", "done"][index % 3] },
    createdAt: daysFromNow(-index),
  });
  generatedOperationsEvents.push({
    _id: fixtureId("676000", index),
    category: ["security", "data-access", "data-integrity", "availability", "application"][index % 5],
    severity: ["critical", "high", "medium", "low"][index % 4],
    event: ["admin.action.failed", "client.api_error", "admin.login.failed"][index % 3],
    source: index % 2 === 0 ? "server" : "client",
    route: index % 3 === 0 ? "/api/admin/projects" : "/api/admin/clients",
    method: index % 3 === 0 ? "POST" : "GET",
    status: index % 3 === 0 ? 500 : 401,
    message: `Seeded operational event ${index}.`,
    errorName: index % 2 === 0 ? "ExampleError" : undefined,
    requestId: `seed-operations-fixture-${index}`,
    ipAddress: index % 2 === 0 ? "192.0.2.10" : "198.51.100.15",
    userAgent: "Seed Fixture Browser",
    occurrences: index % 4 + 1,
    lastSeenAt: daysFromNow(-index),
    createdAt: daysFromNow(-index),
  });
}

clients.push(...generatedClients);
projects.push(...generatedProjects);
secrets.push(...generatedSecrets);
documents.push(...generatedDocuments);
payments.push(...generatedPayments);
inquiries.push(...generatedInquiries);
tasks.push(...generatedTasks);
prospects.push(...generatedProspects);
prospectActivities.push(...generatedProspectActivities);
conversations.push(...generatedConversations);
auditEvents.push(...generatedAuditEvents);
operationsEvents.push(...generatedOperationsEvents);

const collections = {
  clients,
  projects,
  secrets,
  documents,
  payments,
  inquiries,
  tasks,
  prospects,
  prospectactivities: prospectActivities,
  conversationentries: conversations,
  subscribers,
  auditevents: auditEvents,
  operationsevents: operationsEvents,
  emailrecords: emailRecords,
  settings,
};

if (process.argv.includes("--dry-run")) {
  for (const [collectionName, records] of Object.entries(collections)) {
    const ids = records.map((record) => String(record._id));
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Duplicate fixture IDs in ${collectionName}.`);
    }
  }
  console.log(`Fixture dry run for "${seedDatabaseName}" (no database connection made):`);
  for (const [collectionName, records] of Object.entries(collections)) {
    console.log(`  ${collectionName}: ${records.length}`);
  }
  process.exit(0);
}

await mongoose.connect(mongoUri, {
  dbName: seedDatabaseName,
  serverSelectionTimeoutMS: 5_000,
});
try {
  for (const [collectionName, records] of Object.entries(collections)) {
    const mongoCollectionName = collectionName === "documents"
      ? "clientdocuments"
      : collectionName === "payments"
        ? "paymentrecords"
        : collectionName;
    const collection = mongoose.connection.collection(mongoCollectionName);
    if (collectionName === "settings") {
      await collection.updateOne(
        { key: "dashboard" },
        { $setOnInsert: { ...records[0], createdAt: now, updatedAt: now } },
        { upsert: true },
      );
      continue;
    }
    await collection.deleteMany({ _id: { $in: records.map((record) => record._id) } });
    await collection.insertMany(records.map((record) => ({
      ...record,
      createdAt: record.createdAt ?? now,
      updatedAt: record.updatedAt ?? now,
    })));
  }
  console.log(`Seeded demo fixtures into database "${seedDatabaseName}":`);
  console.log("Seeded demo admin data:");
  console.log(`  ${clients.length} clients, ${projects.length} projects, ${tasks.length} tasks`);
  console.log(`  ${secrets.length} secrets, ${documents.length} documents, ${payments.length} payments`);
  console.log(`  ${inquiries.length} inquiries, ${conversations.length} conversation entries`);
  console.log(`  ${prospects.length} prospects, ${prospectActivities.length} prospect activities`);
  console.log(`  ${subscribers.length} subscribers, ${auditEvents.length} audit events, ${operationsEvents.length} operations events`);
  console.log(`  ${emailRecords.length} outbound email records and ${settings.length} dashboard settings`);
} finally {
  await mongoose.disconnect();
}
