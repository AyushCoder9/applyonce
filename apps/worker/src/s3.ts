/** MinIO/S3 helper. ponytail: bucket already created by minio-init; we never create it here. */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const g = globalThis as unknown as { __applyonceS3?: S3Client };

export const s3 = () =>
  (g.__applyonceS3 ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9002",
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") === "true",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "applyonce", secretAccessKey: process.env.S3_SECRET_KEY ?? "applyonce123" },
  }));

export const BUCKET = () => process.env.S3_BUCKET ?? "applyonce-docs";

export async function putObject(key: string, body: Uint8Array, contentType = "application/pdf") {
  await s3().send(new PutObjectCommand({ Bucket: BUCKET(), Key: key, Body: body, ContentType: contentType }));
  return key;
}

export async function getObject(key: string): Promise<Buffer> {
  const out = await s3().send(new GetObjectCommand({ Bucket: BUCKET(), Key: key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of out.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function presignGet(key: string, expiresSeconds = 86400) {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: BUCKET(), Key: key }), { expiresIn: expiresSeconds });
}
