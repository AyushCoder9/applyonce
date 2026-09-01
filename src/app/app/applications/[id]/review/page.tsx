import AuthenticatedWorkspace from "../../../AuthenticatedWorkspace";

export default async function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuthenticatedWorkspace initialView="applications" applicationId={id} />;
}
