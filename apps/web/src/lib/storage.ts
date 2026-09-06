import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { get, put } from "@vercel/blob";

/** S3 / MinIO (path-style). Keys: `docs/<profileId>/<documentId>/<filename>`; mock provider docs use `mock/…` and never touch S3. */
const g = globalThis as unknown as { __applyonceS3?: S3Client };
export const s3 = () =>
  (g.__applyonceS3 ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9002",
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "applyonce", secretAccessKey: process.env.S3_SECRET_KEY ?? "applyonce123" },
  }));
export const bucket = () => process.env.S3_BUCKET ?? "applyonce-docs";
export const storageDriver = () => process.env.STORAGE_DRIVER === "blob" ? "blob" : "s3";
export const isMockKey = (key?: string | null) => !key || key.startsWith("mock/");
export const docKey = (profileId: string, documentId: string, filename: string) => `docs/${profileId}/${documentId}/${filename.replace(/[^\w.\-]+/g, "_").slice(0, 80)}`;

export const presignPut = (key: string, mime: string, expiresIn = 600) =>
  getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: mime }), { expiresIn });
export const presignGet = (key: string, filename: string, expiresIn = 300) =>
  getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: `inline; filename="${filename.replace(/"/g, "")}"` }), { expiresIn });
export async function putBytes(key: string, bytes: Uint8Array, mime: string) {
  if (storageDriver() === "blob") {
    await put(key, Buffer.from(bytes), { access: "private", addRandomSuffix: false, contentType: mime });
    return;
  }
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: bytes, ContentType: mime }));
}
export async function getBytes(key: string): Promise<Uint8Array> {
  if (storageDriver() === "blob") {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) return new Uint8Array();
    return new Uint8Array(await new Response(result.stream).arrayBuffer());
  }
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return r.Body ? await r.Body.transformToByteArray() : new Uint8Array();
}
