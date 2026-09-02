import { db, t, eq } from "@praman/db";
import { handler, ok, ApiError } from "@/lib/api";
import { extensionUser } from "../../../_auth";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3300";

/** GET /api/v1/extension/documents/:id/url — presigned S3 URL, or our own mock.pdf streamer for `mock/` keys. */
export const GET = handler(async (req, { params }) => {
  const id = params.id;
  if (!id) throw new ApiError(400, "BAD_REQUEST", "Missing document id");
  const { all, extSession } = await extensionUser(req);
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, id) });
  if (!doc || !all.some((p) => p.id === doc.profileId)) throw new ApiError(404, "DOCUMENT_NOT_FOUND");

  if (!doc.storageKey || doc.storageKey.startsWith("mock/")) {
    return ok({ url: `${appUrl()}/api/v1/extension/documents/${doc.id}/mock.pdf?token=${extSession.token}`, expiresIn: 300 });
  }

  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "", secretAccessKey: process.env.S3_SECRET_KEY ?? "" },
  });
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: doc.storageKey }), { expiresIn: 300 });
  return ok({ url, expiresIn: 300 });
});
