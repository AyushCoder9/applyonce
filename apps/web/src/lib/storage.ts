import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/** S3 / MinIO (path-style). Keys: `docs/<profileId>/<documentId>/<filename>`; mock provider docs use `mock/…` and never touch S3. */
const g = globalThis as unknown as { __pramanS3?: S3Client };
export const s3 = () =>
  (g.__pramanS3 ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9002",
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "praman", secretAccessKey: process.env.S3_SECRET_KEY ?? "praman123" },
  }));
export const bucket = () => process.env.S3_BUCKET ?? "praman-docs";
export const isMockKey = (key?: string | null) => !key || key.startsWith("mock/");
export const docKey = (profileId: string, documentId: string, filename: string) => `docs/${profileId}/${documentId}/${filename.replace(/[^\w.\-]+/g, "_").slice(0, 80)}`;

export const presignPut = (key: string, mime: string, expiresIn = 600) =>
  getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: mime }), { expiresIn });
export const presignGet = (key: string, filename: string, expiresIn = 300) =>
  getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: `inline; filename="${filename.replace(/"/g, "")}"` }), { expiresIn });
export async function getBytes(key: string): Promise<Uint8Array> {
  const r = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  return r.Body ? await r.Body.transformToByteArray() : new Uint8Array();
}
