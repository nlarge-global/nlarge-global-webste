import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerEnv } from "@/lib/env";

function getR2Config() {
  const env = getServerEnv();
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    throw new Error("R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are required");
  }
  return env;
}

function getClient() {
  const env = getR2Config();
  return {
    client: new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    }),
    bucket: env.R2_BUCKET_NAME!,
  };
}

export async function uploadPrivateObject(key: string, body: Uint8Array, contentType: string) {
  const { client, bucket } = getClient();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function deletePrivateObject(key: string) {
  const { client, bucket } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function createPrivateObjectUrl(key: string, filename: string, contentType: string) {
  const { client, bucket } = getClient();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/["\r\n]/g, "")}"`,
    ResponseContentType: contentType,
  }), { expiresIn: 300 });
}

export async function verifyPrivateStorage() {
  const { client, bucket } = getClient();
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
}

export async function downloadPrivateObject(key: string) {
  const { client, bucket } = getClient();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error("Private object has no body");
  return Buffer.from(await response.Body.transformToByteArray());
}
