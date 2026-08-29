import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <div className="auth-intro">
        <span className="auth-mark">✦</span>
        <p className="eyebrow">A calmer way to apply</p>
        <h1>Build your reusable application profile.</h1>
        <p>
          Start with your own account. ApplyOnce only shares what you approve for a stated
          purpose.
        </p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
