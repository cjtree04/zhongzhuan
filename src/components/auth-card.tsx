import { cn } from "@/lib/utils";

/** 居中认证卡片容器:hero/feature/faq 的精简版，适合 login/register/forgot 用 */
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-6 py-16">
      <div className={cn("w-full max-w-md", className)}>
        <div className="border border-border bg-background p-8 md:p-10">
          <div className="mb-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
              {eyebrow}
            </div>
            <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </div>
        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          / Zhongzhuan Token /
        </div>
      </div>
    </section>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs leading-relaxed text-destructive">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
      {message}
    </div>
  );
}
