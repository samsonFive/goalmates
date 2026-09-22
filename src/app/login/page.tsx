import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">Family dogfood</p>
      <h1 className="mt-2 font-display text-4xl text-forest-deep">GoalMates</h1>
      <p className="mt-2 text-ink-muted">Sign in to your private space and any shared GoalMate households.</p>
      <LoginForm />
      <p className="mt-4 text-sm">
        New here?{" "}
        <Link className="font-semibold text-forest underline" href="/signup">
          Create an account
        </Link>
      </p>
    </main>
  );
}
