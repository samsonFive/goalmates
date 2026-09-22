import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { Button, Field, fieldClass } from "@/components/ui/primitives";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <h1 className="font-display text-4xl text-forest-deep">Create your space</h1>
      <p className="mt-2 text-ink-muted">Every person gets a private space. Shared GoalMate spaces come next.</p>
      <form action={registerAction} className="gm-panel mt-8 space-y-4 p-5">
        <Field label="Name">
          <input className={fieldClass} name="name" required />
        </Field>
        <Field label="Email">
          <input className={fieldClass} name="email" type="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className={fieldClass} name="password" type="password" minLength={8} required />
        </Field>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Already using GoalMates? <Link className="font-semibold text-forest underline" href="/login">Sign in</Link>
      </p>
    </main>
  );
}
