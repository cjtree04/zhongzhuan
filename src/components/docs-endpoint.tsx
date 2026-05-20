"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Endpoint({
  label,
  url,
  note,
}: {
  label: string;
  url: string;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("已复制:" + url);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动选中文本");
    }
  }

  return (
    <div className="border border-border bg-secondary/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="break-all font-mono text-sm font-medium text-brand">
          {url}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label="复制"
          title={copied ? "已复制" : "复制 URL"}
          className="shrink-0 border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
        >
          {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {note ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
      ) : null}
    </div>
  );
}
