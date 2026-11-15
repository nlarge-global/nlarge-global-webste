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
    return { _id: ids.secretA, clientId: ids.clientA, projectId: ids.projectA, label: "Staging API key", type: "api-key", ...encrypted, expiresAt: daysFromNow(90) };
  })(),
  (() => {
    const encrypted = encrypt("demo-portal-token-kapoor", clientBKey.key);
    return { _id: ids.secretB, clientId: ids.clientB, projectId: ids.projectC, label: "Portal integration token", type: "token", ...encrypted, expiresAt: daysFromNow(120) };
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
