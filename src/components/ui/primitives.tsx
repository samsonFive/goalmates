import clsx from "clsx";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-gm px-4 text-sm font-semibold transition",
        variant === "primary" && "bg-forest text-paper-raised hover:bg-forest-deep",
        variant === "secondary" && "border border-paper-rule bg-paper-raised text-ink hover:border-forest-mid",
        variant === "ghost" && "text-forest hover:bg-forest-soft",
        variant === "danger" && "bg-danger text-white",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
}

export const fieldClass =
  "min-h-11 w-full rounded-gm border border-paper-rule bg-paper-raised px-3 text-ink placeholder:text-ink-faint";

export function Panel({
  title,
  kicker,
  action,
  children,
  className,
}: {
  title?: string;
  kicker?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("gm-panel p-4 sm:p-5", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-end justify-between gap-3">
          <div>
            {kicker ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">{kicker}</p>
            ) : null}
            {title ? <h2 className="font-display text-xl text-forest-deep">{title}</h2> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-paper-rule px-4 py-8 text-center">
      <p className="font-display text-lg text-forest-deep">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
