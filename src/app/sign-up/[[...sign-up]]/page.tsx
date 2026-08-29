import { SignUp } from "@clerk/nextjs";
import { ApplyOnceLogo } from "@/components/brand/ApplyOnceLogo";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <div className="auth-intro">
        <ApplyOnceLogo size="lg" />
        <p className="eyebrow">A calmer way to apply</p>
        <h1>Build your reusable application profile.</h1>
        <p>
          Start with your own account. ApplyOnce only shares what you approve for a stated
          purpose.
        </p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={{ elements: { rootBox: "auth-root-box", card: "auth-card" }, variables: { colorPrimary: "#4F46E5", colorBackground: "#FFFFFF", borderRadius: "19px" } }} />
    </main>
  );
}
