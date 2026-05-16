import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start px-6 py-32">
      <div className="mb-6 inline-flex items-center gap-2 border border-border bg-secondary/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <Construction className="size-3 text-brand" />
        COMING SOON
      </div>
      <h1 className="font-mono text-4xl font-semibold tracking-tight md:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          {subtitle}
        </p>
      ) : null}
    </section>
  );
}
