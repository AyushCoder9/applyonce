import HostedForm from "./HostedForm";

export default async function HostedFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <HostedForm slug={slug} />;
}
