export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="font-mono text-xs text-muted-foreground">
          <span className="text-brand font-semibold">Zhongzhuan Token</span>
          <span className="mx-2">·</span>
          © 2026 zhongzhuantoken.com
        </div>
        <div className="font-mono text-[11px] text-muted-foreground/70">
          Powered by{" "}
          <a
            href="https://github.com/QuantumNous/new-api"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            New API
          </a>
          {" · "}
          Built with Next.js
        </div>
      </div>
    </footer>
  );
}
