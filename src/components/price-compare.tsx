"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PROVIDERS,
  TOPUP_RATE,
  USD_TO_CNY,
  formatRmb,
  maxSavings,
  officialRmb,
  ourRmb,
  savingsPercentFor,
  type ModelRow,
} from "@/lib/pricing";

export function PriceCompare() {
  return (
    <section id="pricing" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand">
            PRICING · 价格
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            本站价格 vs 官方真实成本
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            下表展示旗舰模型对比，
            <Link href="/pricing" className="font-medium text-brand underline-offset-2 hover:underline">
              查看完整价格表 →
            </Link>
          </p>
        </div>

        <Tabs defaultValue="claude" className="gap-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-border bg-secondary/40 p-1.5">
            <TabsList variant="line" className="gap-1 bg-transparent">
              {PROVIDERS.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="font-mono px-3">
                  {p.tabLabel}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="px-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              单位:人民币 / 1M tokens
            </div>
          </div>

          {PROVIDERS.map((p) => {
            const max = maxSavings(p.featured);
            return (
              <TabsContent key={p.id} value={p.id} className="mt-0">
                <div className="border border-border bg-background">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
                    <h3 className="font-mono text-2xl font-semibold tracking-tight">
                      {p.tabLabel} 价格对比
                    </h3>
                    <div className="inline-flex items-center gap-2 border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand">
                      <span className="size-1.5 rounded-full bg-brand" />
                      最高省 {max}%
                    </div>
                  </div>

                  {/* Column header */}
                  <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-4 border-b border-border bg-secondary/40 px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
                    <div>模型</div>
                    <div>输入</div>
                    <div>输出</div>
                    <div>缓存读取</div>
                    <div className="text-right">节省</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-border">
                    {p.featured.map((row) => (
                      <PriceRow key={row.model} row={row} />
                    ))}
                  </div>

                  {/* Footnote */}
                  <div className="space-y-1.5 border-t border-border px-6 py-4 text-xs text-muted-foreground">
                    <div>
                      显示价格为人民币(¥) — 你的真实扣费金额。充值比例固定
                      <span className="mx-1 font-mono text-foreground">¥{TOPUP_RATE} → $1 余额</span>；
                      Claude 类按 <span className="font-mono text-foreground">3×</span> 倍率扣 USD 余额，
                      GPT/Gemini 按 <span className="font-mono text-foreground">1×</span> 扣。
                    </div>
                    <div>
                      划线价为官方按真实汇率 <span className="font-mono text-foreground">¥{USD_TO_CNY}/$1</span> 换算的人民币成本，实际扣费以模型、分组和缓存命中情况为准。
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            className="font-mono"
            render={<Link href="/pricing">查看完整价格表</Link>}
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            className="font-mono"
            render={<Link href="/docs">接入文档</Link>}
          />
        </div>
      </div>
    </section>
  );
}

function PriceRow({ row }: { row: ModelRow }) {
  const saved = savingsPercentFor(row.provider);
  return (
    <div className="grid grid-cols-2 items-center gap-3 px-6 py-5 transition-colors hover:bg-secondary/30 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:gap-4">
      <div className="col-span-2 md:col-span-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {row.display}
          </span>
          {row.badge ? (
            <span className="border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {row.badge}
            </span>
          ) : null}
        </div>
      </div>

      <PriceCell label="输入" usd={row.price.input} provider={row.provider} />
      <PriceCell label="输出" usd={row.price.output} provider={row.provider} />
      <PriceCell label="缓存读取" usd={row.price.cacheRead} provider={row.provider} />

      <div className="col-span-2 mt-2 md:col-span-1 md:mt-0 md:text-right">
        {saved > 0 ? (
          <span className="inline-flex items-center border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
            省 {saved}%
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function PriceCell({
  label,
  usd,
  provider,
}: {
  label: string;
  usd?: number;
  provider: "claude" | "gpt";
}) {
  if (usd === undefined) {
    return (
      <div>
        <div className="font-mono text-xs text-muted-foreground md:hidden">{label}</div>
        <div className="font-mono text-base font-medium text-muted-foreground">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="font-mono text-xs text-muted-foreground md:hidden">{label}</div>
      <div className="font-mono text-base font-medium text-brand">
        {formatRmb(ourRmb(usd, provider))}
      </div>
      <div className="font-mono text-[11px] text-muted-foreground/70 line-through">
        官方 {formatRmb(officialRmb(usd))}
      </div>
    </div>
  );
}
