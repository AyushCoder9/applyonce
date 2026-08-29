import { SignIn } from "@clerk/nextjs";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-intro">
        <ApplyOnceLogo size="lg" />
        <p className="eyebrow">Your details. Once. Anywhere.</p>
        <h1>Continue to your citizen workspace.</h1>
        <p>
          Connect trusted sources, review the exact fields a portal needs, and keep a durable
          receipt for every application.
        </p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={{ elements: { rootBox: "auth-root-box", card: "auth-card" }, variables: { colorPrimary: "#4F46E5", colorBackground: "#FFFFFF", borderRadius: "19px" } }} />
    </main>
  );
}
