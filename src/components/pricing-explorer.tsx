"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  GROUP_RATIO,
  PROVIDERS,
  formatRmb,
  maxSavings,
  officialRmb,
  ourRmb,
  savingsPercentFor,
  type ModelRow,
  type Provider,
} from "@/lib/pricing";

export function PricingExplorer() {
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      PROVIDERS.map((p) => ({
        ...p,
        rows: p.full.filter((r) =>
          [r.model, r.display].some((s) =>
            s.toLowerCase().includes(q.toLowerCase()),
          ),
        ),
      })),
    [q],
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border border-border bg-secondary/30 p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索模型名称(如 opus-4-7 / gpt-5.5)"
            className="h-9 pl-9 font-mono text-sm"
          />
        </div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          单位:人民币 / 1M tokens
        </div>
      </div>

      <Tabs defaultValue="claude" className="gap-0">
        <TabsList variant="line" className="mb-6 gap-1 bg-transparent">
          {filtered.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="font-mono px-3">
              {p.tabLabel}
              <span className="ml-2 text-[10px] text-muted-foreground">
                {p.rows.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {filtered.map((p) => {
          const max = maxSavings(p.rows.length ? p.rows : p.full);
          return (
            <TabsContent key={p.id} value={p.id} className="mt-0">
              <div className="border border-border bg-background">
                {/* Title */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
                  <h2 className="font-mono text-2xl font-semibold tracking-tight">
                    {p.name} · {p.tabLabel} 全系
                  </h2>
                  {max > 0 ? (
                    <div className="inline-flex items-center gap-2 border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand">
                      <span className="size-1.5 rounded-full bg-brand" />
                      最低 {100 - max}% 官方价
                    </div>
                  ) : null}
                </div>

                {/* Header */}
                <div className="hidden grid-cols-[1.6fr_repeat(4,1fr)_auto] items-center gap-4 border-b border-border bg-secondary/40 px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
                  <div>模型</div>
                  <div>输入</div>
                  <div>输出</div>
                  <div>缓存读取</div>
                  <div>缓存写入</div>
                  <div className="text-right">节省</div>
                </div>

                {p.rows.length === 0 ? (
                  <div className="px-6 py-12 text-center font-mono text-sm text-muted-foreground">
                    没有匹配的模型。换个关键词试试。
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {p.rows.map((row) => (
                      <FullRow key={row.model} row={row} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function FullRow({ row }: { row: ModelRow }) {
  const saved = savingsPercentFor(row.provider);
  // cacheWrite cell shows the 5min variant (most common); 1h is in tooltip-style hint
  return (
    <div className="grid grid-cols-2 items-center gap-3 px-6 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-[1.6fr_repeat(4,1fr)_auto] md:gap-4">
      <div className="col-span-2 md:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {row.display}
          </span>
          {row.provider === "claude" ? (
            <span
              className="border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400"
              title="Claude 系列倍率 3×:消耗 $1 标价时扣 $3 美元余额"
            >
              ×{GROUP_RATIO.claude}
            </span>
          ) : null}
          {row.badge ? (
            <span
              className={cn(
                "border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                row.badge === "旗舰" || row.badge === "Codex"
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border bg-secondary text-muted-foreground",
              )}
            >
              {row.badge}
            </span>
          ) : null}
        </div>
        {row.model !== row.display ? (
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
            {row.model}
          </div>
        ) : null}
      </div>

      <Cell label="输入" usd={row.price.input} provider={row.provider} />
      <Cell label="输出" usd={row.price.output} provider={row.provider} />
      <Cell label="缓存读取" usd={row.price.cacheRead} provider={row.provider} />
      <Cell label="缓存写入" usd={row.price.cacheWrite} provider={row.provider} />

      <div className="col-span-2 mt-2 md:col-span-1 md:mt-0 md:text-right">
        {saved > 0 ? (
          <span className="inline-flex items-center border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
            {saved}%
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function Cell({
  label,
  usd,
  provider,
}: {
  label: string;
  usd?: number;
  provider: Provider;
}) {
  if (usd === undefined) {
    return (
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">
          {label}
        </div>
        <div className="font-mono text-sm font-medium text-muted-foreground">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">
        {label}
      </div>
      <div className="font-mono text-sm font-medium text-brand">
        {formatRmb(ourRmb(usd, provider))}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground/70 line-through">
        官方 {formatRmb(officialRmb(usd))}
      </div>
    </div>
  );
}
