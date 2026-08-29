import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-intro">
        <span className="auth-mark">✦</span>
        <p className="eyebrow">Your details. Once. Anywhere.</p>
        <h1>Continue to your citizen workspace.</h1>
        <p>
          Connect trusted sources, review the exact fields a portal needs, and keep a durable
          receipt for every application.
        </p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main>
  );
}
