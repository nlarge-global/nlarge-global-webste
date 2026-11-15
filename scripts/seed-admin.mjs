import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadEnvFile(filename) {
  const file = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const mongoUri = process.env.MONGODB_URI;
const masterKeyValue = process.env.MASTER_ENCRYPTION_KEY;
if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (!masterKeyValue) throw new Error("MASTER_ENCRYPTION_KEY is required to seed encrypted secrets.");

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
  documentA: new mongoose.Types.ObjectId("65f000000000000000000031"),
  paymentA: new mongoose.Types.ObjectId("65f000000000000000000041"),
  paymentB: new mongoose.Types.ObjectId("65f000000000000000000042"),
  inquiryA: new mongoose.Types.ObjectId("65f000000000000000000051"),
  inquiryB: new mongoose.Types.ObjectId("65f000000000000000000052"),
  taskA: new mongoose.Types.ObjectId("65f000000000000000000061"),
  taskB: new mongoose.Types.ObjectId("65f000000000000000000062"),
  taskC: new mongoose.Types.ObjectId("65f000000000000000000063"),
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
    technicalDetails: "Visual identity and reusable presentation templates.",
    deliveryDetails: "Deliver final logo exports and social templates.",
    environment: "Discovery",
    deadline: daysFromNow(45),
  },
  {
    _id: ids.projectC,
    clientId: ids.clientB,
    name: "Kapoor Foods Ordering Portal",
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
  { _id: ids.inquiryA, name: "Aarav Mehta", email: "aarav@example.com", queryType: "business", subject: "Website launch follow-up", message: "Can we review the launch checklist this week?", consent: true, source: "website", status: "converted", priority: "high", tags: ["website"], clientId: ids.clientA, idempotencyKey: "seed-inquiry-a" },
  { _id: ids.inquiryB, name: "Nisha Kapoor", email: "nisha@example.com", queryType: "support", subject: "Portal staging review", message: "The staging review is ready to schedule.", consent: true, source: "referral", status: "in-progress", priority: "normal", tags: ["portal"], clientId: ids.clientB, idempotencyKey: "seed-inquiry-b" },
];

const tasks = [
  { _id: ids.taskA, clientId: ids.clientA, projectId: ids.projectA, title: "Review responsive launch checklist", status: "in-progress", priority: "high", dueDate: daysFromNow(3), notes: "Check mobile navigation, forms, and metadata." },
  { _id: ids.taskB, clientId: ids.clientA, projectId: ids.projectB, title: "Approve final brand exports", status: "todo", priority: "normal", dueDate: daysFromNow(10) },
  { _id: ids.taskC, clientId: ids.clientB, projectId: ids.projectC, title: "Test staff order workflow", status: "done", priority: "normal", dueDate: daysFromNow(-2), completedAt: daysFromNow(-3) },
];

const generatedClients = [];
const generatedProjects = [];
const generatedSecrets = [];
const generatedDocuments = [];
const generatedPayments = [];
const generatedInquiries = [];
const generatedTasks = [];
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
        dueDate: daysFromNow(index % 9 === 0 ? -index : index + taskIndex),
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
        _id: fixtureId("66e000", (index - 1) * 2 + projectIndex),
        clientId,
        projectId,
        filename: index % 5 === 0 ? `fixture file ${index} — weird & long name.pdf` : `fixture-${index}-${projectIndex}.pdf`,
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
    consent: true,
    source: ["website", "whatsapp", "linkedin", "call", "friend", "personal", "referral", "other"][index % 8],
    status: ["new", "in-progress", "converted", "archived"][index % 4],
    priority: ["low", "normal", "high"][index % 3],
    tags: index % 5 === 0 ? ["fixture", "long-tag", "weird-data"] : ["fixture"],
    nextAction: index % 3 === 0 ? weirdText.slice(0, 500) : undefined,
    followUpAt: daysFromNow(index - 15),
    clientId: index % 4 === 0 ? generatedClients[index - 1]._id : undefined,
    idempotencyKey: `seed-fixture-inquiry-${index}`,
  });
}

clients.push(...generatedClients);
projects.push(...generatedProjects);
secrets.push(...generatedSecrets);
documents.push(...generatedDocuments);
payments.push(...generatedPayments);
inquiries.push(...generatedInquiries);
tasks.push(...generatedTasks);

const collections = {
  clients,
  projects,
  secrets,
  documents,
  payments,
  inquiries,
  tasks,
};

await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5_000 });
try {
  for (const [collectionName, records] of Object.entries(collections)) {
    const collection = mongoose.connection.collection(collectionName === "documents" ? "clientdocuments" : collectionName === "payments" ? "paymentrecords" : collectionName);
    await collection.deleteMany({ _id: { $in: records.map((record) => record._id) } });
    await collection.insertMany(records.map((record) => ({ ...record, createdAt: now, updatedAt: now })));
  }
  console.log("Seeded demo admin data:");
  console.log(`  ${clients.length} clients, ${projects.length} projects, ${tasks.length} tasks`);
  console.log(`  ${secrets.length} secrets, ${documents.length} documents, ${payments.length} payments`);
  console.log(`  ${inquiries.length} inquiries`);
} finally {
  await mongoose.disconnect();
}
