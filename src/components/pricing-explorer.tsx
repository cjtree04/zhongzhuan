"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TOPUP_RATE,
  USD_TO_CNY,
  formatRmb,
  officialRmb,
  type GroupTone,
  type PricedRow,
  type TabView,
} from "@/lib/pricing";

/** 色调 → 倍率徽章 tailwind 类 */
function ratioBadgeClasses(tone: GroupTone): string {
  switch (tone) {
    case "brand":
      return "border-brand/40 bg-brand/10 text-brand";
    case "amber":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "sky":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400";
    default:
      return "border-border bg-secondary text-muted-foreground";
  }
}

function dotClasses(tone: GroupTone): string {
  switch (tone) {
    case "brand":
      return "bg-brand";
    case "amber":
      return "bg-amber-500";
    case "sky":
      return "bg-sky-500";
    default:
      return "bg-muted-foreground";
  }
}

export function PricingExplorer({ views }: { views: TabView[] }) {
  const [q, setQ] = useState("");

  // 搜索只过滤非维护中 tab 的 blocks/rows;维护中 tab 始终保留维护态
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return views;
    return views.map((v) => {
      if (v.maintenance) return v;
      return {
        ...v,
        blocks: v.blocks
          .map((b) => ({
            ...b,
            rows: b.rows.filter((r) =>
              r.model.model_name.toLowerCase().includes(term),
            ),
          }))
          .filter((b) => b.rows.length > 0),
      };
    });
  }, [views, q]);

  if (views.length === 0) {
    return (
      <div className="border border-border bg-secondary/30 px-6 py-16 text-center">
        <div className="font-mono text-sm text-muted-foreground">
          价格数据暂时无法加载，请刷新页面或稍后再试。
        </div>
      </div>
    );
  }

  // 默认选中第一个非维护的 tab(若全是维护中则选第一个)
  const defaultTab =
    filtered.find((v) => !v.maintenance)?.id ?? filtered[0].id;

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

      <Tabs defaultValue={defaultTab} className="gap-0">
        <TabsList variant="line" className="mb-6 flex-wrap gap-1 bg-transparent">
          {filtered.map((v) => {
            const count = v.blocks.reduce((sum, b) => sum + b.rows.length, 0);
            return (
              <TabsTrigger key={v.id} value={v.id} className="font-mono px-3">
                <span
                  className={cn(
                    "mr-2 size-1.5 rounded-full",
                    v.maintenance ? "bg-muted-foreground/50" : dotClasses(v.tone),
                  )}
                />
                <span className={v.maintenance ? "text-muted-foreground" : undefined}>
                  {v.label}
                </span>
                {v.maintenance ? (
                  <span className="ml-2 border border-border bg-secondary px-1 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    维护中
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {filtered.map((v) => (
          <TabsContent key={v.id} value={v.id} className="mt-0">
            <div className="border border-border bg-background">
              {/* tab header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-2xl font-semibold tracking-tight">
                      {v.label}
                    </h2>
                    <span
                      className={cn(
                        "border px-2 py-0.5 font-mono text-[11px] font-semibold",
                        v.maintenance
                          ? "border-border bg-secondary text-muted-foreground"
                          : ratioBadgeClasses(v.tone),
                      )}
                      title={`分组倍率 ${v.ratio}×:消耗 $1 标价时扣 $${v.ratio} 美元余额`}
                    >
                      ×{v.ratio}
                    </span>
                    {v.maintenance ? (
                      <span className="inline-flex items-center gap-1 border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Wrench className="size-3" />
                        维护中
                      </span>
                    ) : v.highlight ? (
                      <span className="border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                        最划算
                      </span>
                    ) : null}
                  </div>
                  {v.desc ? (
                    <p className="mt-1.5 max-w-2xl text-xs text-muted-foreground md:text-sm">
                      {v.desc}
                    </p>
                  ) : null}
                </div>
                {!v.maintenance && v.savings > 0 ? (
                  <div className="inline-flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    最低 {100 - v.savings}% 官方价
                  </div>
                ) : null}
              </div>

              {/* body */}
              {v.maintenance ? (
                <MaintenanceBlock label={v.label} />
              ) : v.blocks.length === 0 ? (
                <div className="px-6 py-12 text-center font-mono text-sm text-muted-foreground">
                  没有匹配的模型，换个关键词试试。
                </div>
              ) : (
                v.blocks.map((b) => (
                  <div key={b.vendor.id}>
                    <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-6 py-2.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {b.vendor.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        · {b.rows.length} 个模型
                      </span>
                    </div>

                    {/* 列 header(桌面) */}
                    <div className="hidden grid-cols-[1.6fr_repeat(4,1fr)_auto] items-center gap-4 border-b border-border bg-secondary/20 px-6 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
                      <div>模型</div>
                      <div>输入</div>
                      <div>输出</div>
                      <div>缓存读取</div>
                      <div>缓存写入</div>
                      <div className="text-right">节省</div>
                    </div>

                    <div className="divide-y divide-border">
                      {b.rows.map((row) => (
                        <Row key={row.model.model_name} row={row} tone={v.tone} />
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* 计价公式(维护中或无数据时不显示) */}
              {!v.maintenance && v.blocks.length > 0 ? (
                <PricingFormula
                  groupName={v.label}
                  ratio={v.ratio}
                  tone={v.tone}
                  sample={v.blocks[0].rows[0]}
                />
              ) : null}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MaintenanceBlock({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center border border-border bg-secondary text-muted-foreground">
        <Wrench className="size-5" />
      </div>
      <div className="font-mono text-sm font-medium text-foreground">
        {label} · 维护中
      </div>
    </div>
  );
}

function Row({ row, tone }: { row: PricedRow; tone: GroupTone }) {
  const [copied, setCopied] = useState(false);

  async function copyModelName() {
    try {
      await navigator.clipboard.writeText(row.model.model_name);
      setCopied(true);
      toast.success(`已复制模型名:${row.model.model_name}`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("复制失败，请手动选中文本");
    }
  }

  // 行级节省(按用户实际 USD vs 官方按 USD_TO_CNY 折算)
  const rowSavings = Math.max(
    0,
    Math.round((1 - row.user.input / (row.official.input * USD_TO_CNY)) * 100),
  );

  return (
    <div className="grid grid-cols-2 items-center gap-3 px-6 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-[1.6fr_repeat(4,1fr)_auto] md:gap-4">
      <div className="col-span-2 md:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyModelName}
            title={copied ? "已复制" : "点击复制模型名"}
            className="group inline-flex items-center gap-1.5 border border-transparent px-1 py-0.5 font-mono text-sm font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
          >
            {row.model.model_name}
            {copied ? (
              <Check className="size-3 text-brand" />
            ) : (
              <Copy className="size-3 text-muted-foreground/60 transition-colors group-hover:text-brand" />
            )}
          </button>
          <span
            className={cn(
              "border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              ratioBadgeClasses(tone),
            )}
            title={`分组倍率 ${row.groupRatio}×:消耗 $1 标价时扣 $${row.groupRatio} 美元余额`}
          >
            ×{row.groupRatio}
          </span>
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
      </div>

      <Cell label="输入" rmb={row.userRmb.input} officialUsd={row.official.input} />
      <Cell label="输出" rmb={row.userRmb.output} officialUsd={row.official.output} />
      <Cell label="缓存读取" rmb={row.userRmb.cacheRead} officialUsd={row.official.cacheRead} />
      <Cell label="缓存写入" rmb={row.userRmb.cacheWrite} officialUsd={row.official.cacheWrite} />

      <div className="col-span-2 mt-2 md:col-span-1 md:mt-0 md:text-right">
        <span className="inline-flex items-center border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
          {rowSavings}%
        </span>
      </div>
    </div>
  );
}

function Cell({
  label,
  rmb,
  officialUsd,
}: {
  label: string;
  rmb?: number;
  officialUsd?: number;
}) {
  if (rmb === undefined || officialUsd === undefined) {
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
        {formatRmb(rmb)}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground/70 line-through">
        官方 {formatRmb(officialRmb(officialUsd))}
      </div>
    </div>
  );
}

function PricingFormula({
  groupName,
  ratio,
  tone,
  sample,
}: {
  groupName: string;
  ratio: number;
  tone: GroupTone;
  sample: PricedRow;
}) {
  const officialUsd = sample.official.input;
  const finalRmb = sample.userRmb.input;
  const toneText =
    tone === "brand"
      ? "text-brand"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "sky"
          ? "text-sky-600 dark:text-sky-400"
          : "text-foreground";

  return (
    <div className="border-t border-border bg-secondary/30 px-6 py-4 font-mono text-xs leading-relaxed text-muted-foreground md:text-[13px]">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-foreground">
        计价公式 · {groupName}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span>实际人民币 = 官方美元价 ×</span>
        <span className="text-foreground">{TOPUP_RATE}</span>
        <span>(充值比例) ×</span>
        <span className={toneText}>{ratio}</span>
        <span>(分组倍率)</span>
      </div>

      <div className="mt-3 border-l-2 border-brand/40 pl-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          举例 · {sample.model.model_name}(输入)
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-foreground">
          <span className="text-muted-foreground">${officialUsd}</span>
          <span className="text-muted-foreground/60">×</span>
          <span className="text-muted-foreground">{TOPUP_RATE}</span>
          <span className="text-muted-foreground/60">×</span>
          <span className="text-muted-foreground">{ratio}</span>
          <span className="text-muted-foreground/60">=</span>
          <span className="font-semibold text-brand">
            {formatRmb(finalRmb)} / 1M tokens
          </span>
        </div>
      </div>
    </div>
  );
}
