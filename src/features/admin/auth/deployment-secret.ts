import crypto from "node:crypto";

export type DeploymentSecretType =
  | "ADMIN_SESSION_SECRET"
  | "UNSUBSCRIBE_TOKEN_SECRET"
  | "MASTER_ENCRYPTION_KEY";

export function generateDeploymentSecret(type: DeploymentSecretType) {
  return crypto.randomBytes(32).toString(
    type === "MASTER_ENCRYPTION_KEY" ? "base64" : "base64url",
  );
}
