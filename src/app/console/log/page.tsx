"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ListFilter,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  api,
  type LogQuery,
  type LogRow,
  type SiteStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

const DEFAULT_QUOTA_PER_UNIT = 500000;
const DEFAULT_USD_RATE = 1;

function formatRmb(quota: number, status: SiteStatus | null): string {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  const rate = status?.usd_exchange_rate || DEFAULT_USD_RATE;
  const cny = (quota / perUnit) * rate;
  if (cny >= 10) return `¥${cny.toFixed(2)}`;
  if (cny >= 0.01) return `¥${cny.toFixed(3)}`;
  return `¥${cny.toFixed(4)}`;
}

function formatTime(unix: number): string {
  if (!unix) return "—";
  const d = new Date(unix * 1000);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const LOG_TYPES = [
  { value: 0, label: "全部" },
  { value: 2, label: "消费" },
  { value: 1, label: "充值" },
  { value: 6, label: "退款" },
  { value: 5, label: "错误" },
  { value: 3, label: "管理" },
  { value: 4, label: "系统" },
] as const;

const TYPE_META: Record<
  number,
  { label: string; cls: string; icon: typeof Activity }
> = {
  1: { label: "充值", cls: "border-brand/30 bg-brand/10 text-brand", icon: Wallet },
  2: { label: "消费", cls: "border-border bg-secondary text-foreground", icon: CircleDollarSign },
  3: { label: "管理", cls: "border-border bg-secondary text-muted-foreground", icon: ListFilter },
  4: { label: "系统", cls: "border-border bg-secondary text-muted-foreground", icon: Activity },
  5: { label: "错误", cls: "border-destructive/30 bg-destructive/10 text-destructive", icon: XCircle },
  6: { label: "退款", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", icon: CircleDollarSign },
};

const TIME_PRESETS = [
  { label: "今天", days: 0 },
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "全部", days: -1 },
] as const;

export default function LogPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [typeFilter, setTypeFilter] = useState<number>(2); // 默认看消费
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);
  const [modelName, setModelName] = useState("");
  const [tokenName, setTokenName] = useState("");

  // 未登录跳走
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/login?redirect=/console/log");
    }
  }, [authLoading, user]);

  useEffect(() => {
    api.status().then((r) => r.success && r.data && setStatus(r.data));
  }, []);

  const buildQuery = useCallback((): LogQuery => {
    let startTs: number | undefined;
    let endTs: number | undefined;
    if (timeRangeDays >= 0) {
      const now = Math.floor(Date.now() / 1000);
      if (timeRangeDays === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startTs = Math.floor(today.getTime() / 1000);
      } else {
        startTs = now - timeRangeDays * 86400;
      }
      endTs = now;
    }
    return {
      page,
      pageSize,
      type: typeFilter,
      startTimestamp: startTs,
      endTimestamp: endTs,
      modelName: modelName.trim() || undefined,
      tokenName: tokenName.trim() || undefined,
    };
  }, [page, pageSize, typeFilter, timeRangeDays, modelName, tokenName]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await api.logs(buildQuery());
    setLoading(false);
    if (!r.success) {
      setError(r.message || "加载失败");
      return;
    }
    setLogs(r.data?.items || []);
    setTotal(r.data?.total || 0);
  }, [buildQuery]);

  useEffect(() => {
    if (!user) return;
    fetchLogs();
  }, [user, fetchLogs]);

  // 重置 page 当 filter 变化
  useEffect(() => {
    setPage(0);
  }, [typeFilter, timeRangeDays, modelName, tokenName]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  // 汇总
  const summary = useMemo(() => {
    const totalCost = logs.reduce((s, l) => s + (l.quota || 0), 0);
    const totalPromptTokens = logs.reduce(
      (s, l) => s + (l.prompt_tokens || 0),
      0,
    );
    const totalCompletionTokens = logs.reduce(
      (s, l) => s + (l.completion_tokens || 0),
      0,
    );
    return { totalCost, totalPromptTokens, totalCompletionTokens };
  }, [logs]);

  if (authLoading || !user) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/console"
            className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-brand"
          >
            <ArrowLeft className="size-3" />
            返回控制台
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
            LOGS · 使用日志
          </div>
          <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            调用日志
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            本页汇总当前过滤条件下的{" "}
            <span className="font-mono text-foreground">
              {logs.length.toLocaleString()}
            </span>{" "}
            条记录(共 {total.toLocaleString()})
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-6 space-y-3 border border-border bg-secondary/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              类型
            </Label>
            {LOG_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTypeFilter(t.value)}
                className={cn(
                  "border px-2.5 py-1 font-mono text-xs transition-colors",
                  typeFilter === t.value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-foreground hover:border-brand/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              时间
            </Label>
            {TIME_PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setTimeRangeDays(p.days)}
                className={cn(
                  "border px-2.5 py-1 font-mono text-xs transition-colors",
                  timeRangeDays === p.days
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-foreground hover:border-brand/50",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="模型名(如 gpt-5.5,留空 = 全部)"
              className="h-9 font-mono text-xs"
            />
            <Input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token 名(留空 = 全部)"
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>

        {/* Summary stats */}
        {logs.length > 0 && (typeFilter === 2 || typeFilter === 0) ? (
          <div className="mb-6 grid grid-cols-3 gap-px border border-border bg-border md:max-w-2xl">
            <div className="bg-background p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                本页消耗
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-brand">
                {formatRmb(summary.totalCost, status)}
              </div>
            </div>
            <div className="bg-background p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                输入 Tokens
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                {summary.totalPromptTokens.toLocaleString()}
              </div>
            </div>
            <div className="bg-background p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                输出 Tokens
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-foreground">
                {summary.totalCompletionTokens.toLocaleString()}
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {/* Table */}
        <div className="border border-border bg-background">
          {/* Column header (desktop) */}
          <div className="hidden grid-cols-[160px_70px_1.5fr_1.2fr_1fr_70px_90px] items-center gap-3 border-b border-border bg-secondary/40 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground lg:grid">
            <div>时间</div>
            <div>类型</div>
            <div>模型 / Token</div>
            <div>Tokens</div>
            <div>消耗</div>
            <div>用时</div>
            <div className="text-right">来源</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 font-mono text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              loading…
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="font-mono text-sm text-muted-foreground">
                当前过滤条件下没有日志
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <LogRowDisplay key={log.id} log={log} status={status} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > pageSize ? (
            <div className="flex items-center justify-between border-t border-border px-6 py-3 font-mono text-xs text-muted-foreground">
              <span>
                第 {page + 1} / {totalPages} 页 · 共 {total.toLocaleString()} 条
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="font-mono"
                >
                  <ChevronLeft />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="font-mono"
                >
                  下一页
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
function LogRowDisplay({
  log,
  status,
}: {
  log: LogRow;
  status: SiteStatus | null;
}) {
  const meta = TYPE_META[log.type] || TYPE_META[2];
  const Icon = meta.icon;

  return (
    <div className="grid grid-cols-2 items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/30 lg:grid-cols-[160px_70px_1.5fr_1.2fr_1fr_70px_90px]">
      {/* 时间 */}
      <div className="col-span-2 font-mono text-xs text-muted-foreground lg:col-span-1">
        <div className="text-foreground">{formatTime(log.created_at)}</div>
      </div>

      {/* 类型 */}
      <div className="col-span-1 lg:col-span-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            meta.cls,
          )}
        >
          <Icon className="size-3" />
          {meta.label}
        </span>
      </div>

      {/* 模型 / Token */}
      <div className="col-span-1 min-w-0 lg:col-span-1">
        {log.model_name ? (
          <div className="truncate font-mono text-sm font-medium text-foreground">
            {log.model_name}
          </div>
        ) : (
          <div className="font-mono text-xs text-muted-foreground">—</div>
        )}
        {log.token_name ? (
          <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            via {log.token_name}
          </div>
        ) : null}
      </div>

      {/* Tokens */}
      <div className="col-span-1 font-mono text-xs">
        {log.prompt_tokens + log.completion_tokens > 0 ? (
          <>
            <div className="text-foreground">
              <span className="text-muted-foreground/70">in </span>
              {log.prompt_tokens.toLocaleString()}
              <span className="text-muted-foreground/70"> · out </span>
              {log.completion_tokens.toLocaleString()}
            </div>
          </>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        )}
      </div>

      {/* 消耗 */}
      <div className="col-span-1 lg:col-span-1">
        <div className="font-mono text-sm font-semibold text-brand">
          {log.quota > 0 ? formatRmb(log.quota, status) : "—"}
        </div>
      </div>

      {/* 用时 */}
      <div className="col-span-1 font-mono text-xs text-muted-foreground lg:col-span-1">
        <div className="lg:hidden text-muted-foreground/70">用时</div>
        {formatDuration(log.use_time)}
        {log.is_stream ? (
          <span className="ml-1 text-[10px] uppercase tracking-wider text-brand/80">
            stream
          </span>
        ) : null}
      </div>

      {/* 来源 IP */}
      <div className="col-span-2 truncate font-mono text-[10px] text-muted-foreground lg:col-span-1 lg:text-right">
        {log.ip || "—"}
      </div>

      {/* 内容(失败信息等)— 占满下一行 */}
      {log.content && log.type === 5 ? (
        <div className="col-span-2 mt-1 border-l-2 border-destructive/30 bg-destructive/5 px-2 py-1 font-mono text-[11px] text-destructive lg:col-span-7">
          {log.content}
        </div>
      ) : null}
    </div>
  );
}
