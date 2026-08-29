import { getPartnerRequestContext, listPartnerSubmissions } from "@/lib/partner-service";

export async function GET(request: Request) {
  const context = await getPartnerRequestContext(request, "submissions:read");
  if (!context) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { organization } = context;
  return Response.json({ submissions: await listPartnerSubmissions(organization.id) });
}
