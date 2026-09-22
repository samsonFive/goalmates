"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button, Field, fieldClass } from "@/components/ui/primitives";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
      callbackUrl: "/home",
    });
    if (result?.error) {
      setError("Email or password did not match.");
      setPending(false);
      return;
    }
    window.location.href = result?.url || "/home";
  }

  return (
    <form onSubmit={onSubmit} className="gm-panel mt-8 space-y-4 p-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Field label="Email">
        <input className={fieldClass} name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password">
        <input className={fieldClass} name="password" type="password" required autoComplete="current-password" />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Continue"}
      </Button>
      <p className="text-xs text-ink-muted">
        Demo household: <code>jordan@goalmates.local</code> / <code>sam@goalmates.local</code> with password{" "}
        <code>household-demo</code>
      </p>
    </form>
  );
}
