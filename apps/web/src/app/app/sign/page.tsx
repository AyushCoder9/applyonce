import { PageHeader } from "@applyonce/ui";
import { requireUser } from "@/lib/session";
import { DeclarationForm } from "@/components/declaration-form";
export const metadata={title:"Declaration receipt"};
export default async function SignPage(){await requireUser("/app/sign");return <div><PageHeader back={{href:"/app/verify",label:"Verify"}} eyebrow="Sandbox e-Sign alternative" title="Make your declaration traceable." subtitle="Create a timestamped, OTP-confirmed receipt you can download. A licensed e-Sign provider can replace this sandbox flow after onboarding."/><DeclarationForm/></div>;}
