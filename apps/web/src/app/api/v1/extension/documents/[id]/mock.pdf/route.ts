import { db, t, eq } from "@praman/db";
import { handler, ApiError } from "@/lib/api";
import { tinyPdf } from "../../../_pdf";
import { extensionUser } from "../../../_auth";

/** GET /api/v1/extension/documents/:id/mock.pdf — streams a tiny generated PDF for `mock/` storage keys. */
export const GET = handler(async (req, { params }) => {
  const id = params.id;
  if (!id) throw new ApiError(400, "BAD_REQUEST", "Missing document id");
  const { all } = await extensionUser(req);
  const doc = await db.query.documents.findFirst({ where: eq(t.documents.id, id) });
  if (!doc || !all.some((p) => p.id === doc.profileId)) throw new ApiError(404, "DOCUMENT_NOT_FOUND");

  const pdf = tinyPdf(doc.title, `${doc.issuerName ?? "Praman"} \xB7 ${doc.docType}`);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${doc.title.replace(/[^\w.-]+/g, "_")}.pdf"`,
      "cache-control": "private, max-age=300",
    },
  });
});
