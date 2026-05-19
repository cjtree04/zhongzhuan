"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CircleDollarSign,
  Copy,
  ExternalLink,
  KeyRound,
  LineChart,
  ListChecks,
  Megaphone,
  Plus,
  ReceiptText,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  api,
  type LogRow,
  type SiteStatus,
  type TokenRow,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

import { formatRmbHint, formatUsd } from "@/lib/format-quota";

function timeAgo(unix: number): string {
  if (!unix) return "—";
  const d = new Date(unix * 1000);
  const days = Math.floor((Date.now() / 1000 - unix) / 86400);
  if (days === 0) return "今天";
  if (days < 30) return `${days} 天前`;
  return d.toLocaleDateString("zh-CN");
}

export default function ConsolePage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [tokenTotal, setTokenTotal] = useState(0);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [usageLogs, setUsageLogs] = useState<LogRow[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    // 公开,即使未登录也能拉
    api.status().then((r) => {
      if (r.success && r.data) setStatus(r.data);
    });
    fetch("/api/notice", { credentials: "include" })
      .then((r) => r.text())
      .then((t) => {
        const clean = t?.trim();
        if (clean && clean.length > 0 && clean !== "null") setNotice(clean);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    setTokensLoading(true);
    api.tokens(0, 5).then((r) => {
      if (r.success && r.data) {
        setTokens(r.data.items || []);
        setTokenTotal(r.data.total || 0);
      }
      setTokensLoading(false);
    });
    const now = Math.floor(Date.now() / 1000);
    api
      .logs({
        page: 0,
        pageSize: 200,
        type: 2,
        startTimestamp: now - 7 * 86400,
        endTimestamp: now,
      })
      .then((r) => {
        if (r.success && r.data) {
          setUsageLogs(r.data.items || []);
        } else {
          setUsageLogs([]);
        }
      });
  }, [user]);

  // 未登录 → 跳 /login
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/login?redirect=/console");
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          loading…
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* 公告 banner */}
        {notice && !noticeDismissed ? (
          <div className="mb-8 flex items-start gap-3 border border-brand/30 bg-brand/5 p-4">
            <Megaphone className="mt-0.5 size-4 shrink-0 text-brand" />
            <div className="flex-1 font-mono text-xs leading-relaxed text-foreground/80">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-brand">
                NOTICE · 系统公告
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: notice }}
              />
            </div>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-brand"
            >
              关闭
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              CONSOLE · 控制台
            </div>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
              欢迎回来,{user.display_name || user.username}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              组别 {user.group} · 用户 #{user.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              nativeButton={false}
              className="font-mono"
              render={
                <Link href="/console/topup" target="_top">
                  <Wallet />
                  充值
                </Link>
              }
            />
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              className="font-mono"
              render={
                <Link href="/docs">
                  <BookOpen />
                  接入文档
                </Link>
              }
            />
          </div>
        </div>

        {/* 4 张数据卡 */}
        <div className="mb-10 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={CircleDollarSign}
            label="可用余额"
            value={formatUsd(user.quota, status)}
            sub={formatRmbHint(user.quota, status)}
            highlight
          />
          <Stat
            icon={ReceiptText}
            label="累计消耗"
            value={formatUsd(user.used_quota, status)}
            sub={`${formatRmbHint(user.used_quota, status)} · ${user.request_count.toLocaleString()} 次请求`}
          />
          <Stat
            icon={KeyRound}
            label="我的 Token"
            value={String(tokenTotal)}
            sub={tokenTotal > 0 ? "活跃中" : "尚未创建"}
          />
          <Stat
            icon={Activity}
            label="邀请奖励"
            value={formatUsd(user.aff_history_quota || 0, status)}
            sub={`${formatRmbHint(user.aff_history_quota || 0, status)} · ${user.aff_count || 0} 人已注册`}
          />
        </div>

        {/* 7 天用量看板 */}
        <UsagePanel logs={usageLogs} status={status} />

        {/* 我的 Token 列表 */}
        <div className="mb-10 border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <KeyRound className="size-4 text-brand" />
              <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
                我的 API Token
              </h2>
              {tokenTotal > 0 ? (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  显示前 {Math.min(5, tokenTotal)} / 共 {tokenTotal} 个
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                nativeButton={false}
                className="font-mono"
                render={
                  <Link href="/console/token" target="_top">
                    <Plus />
                    创建
                  </Link>
                }
              />
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                className="font-mono"
                render={
                  <Link href="/console/token" target="_top">
                    管理全部
                    <ArrowUpRight />
                  </Link>
                }
              />
            </div>
          </div>

          {tokensLoading ? (
            <div className="px-6 py-12 text-center font-mono text-sm text-muted-foreground">
              loading…
            </div>
          ) : tokens.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="font-mono text-sm text-muted-foreground">
                你还没创建 API Token
              </div>
              <Button
                className="mt-4 font-mono"
                nativeButton={false}
                render={
                  <Link href="/console/token" target="_top">
                    <Plus />
                    创建第一个 Token
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tokens.map((tok) => (
                <TokenRowDisplay key={tok.id} token={tok} status={status} />
              ))}
            </div>
          )}
        </div>

        {/* 快捷入口 */}
        <div>
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
            QUICK · 快捷入口
          </h2>
          <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
            <QuickLink
              icon={Wallet}
              label="充值"
              href="/console/topup"
            />
            <QuickLink
              icon={ListChecks}
              label="使用日志"
              href="/console/log"
            />
            <QuickLink
              icon={BookOpen}
              label="接入文档"
              href="/docs"
            />
            <QuickLink
              icon={Settings}
              label="个人设置"
              href="/console/personal"
            />
          </div>
          {user.role >= 10 ? (
            <div className="mt-3 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
              <QuickLink
                icon={Settings}
                label="管理员后台"
                href="/admin"
                external
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 子组件
// ──────────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="group flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-secondary/40 md:p-7">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn(
            "size-4 transition-transform group-hover:-translate-y-0.5",
            highlight ? "text-brand" : "text-muted-foreground",
          )}
        />
      </div>
      <div
        className={cn(
          "font-mono text-3xl font-semibold tracking-tight md:text-4xl",
          highlight && "text-brand",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="font-mono text-xs text-muted-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

function TokenRowDisplay({
  token,
  status,
}: {
  token: TokenRow;
  status: SiteStatus | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyMaskedKey() {
    // masked key 复制无意义,但用户体验上需要一个反馈
    try {
      await navigator.clipboard.writeText(`sk-${token.key}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/30">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {token.name || `Token #${token.id}`}
          </span>
          {token.status === 1 ? (
            <span className="border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              启用
            </span>
          ) : (
            <span className="border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              已禁用
            </span>
          )}
          {token.unlimited_quota ? (
            <span className="border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
              无限额
            </span>
          ) : null}
        </div>
        <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          sk-{token.key} · 创建 {timeAgo(token.created_time)}
          {token.accessed_time > 0
            ? ` · 最近 ${timeAgo(token.accessed_time)}`
            : ""}
        </div>
      </div>

      {!token.unlimited_quota ? (
        <div className="text-right">
          <div className="font-mono text-sm font-medium text-foreground">
            {formatUsd(token.remain_quota, status)}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {formatRmbHint(token.remain_quota, status)}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground/70">
            已用 {formatUsd(token.used_quota, status)}
          </div>
        </div>
      ) : null}

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={copyMaskedKey}
        title={copied ? "已复制" : "复制(masked)"}
        className="text-muted-foreground"
      >
        <Copy />
      </Button>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: typeof Wallet;
  label: string;
  href: string;
  external?: boolean;
}) {
  const content = (
    <div className="group flex items-center justify-between gap-3 bg-background p-5 transition-colors hover:bg-secondary/40">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-brand transition-transform group-hover:-translate-y-0.5" />
        <span className="font-mono text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      {external ? (
        <ExternalLink className="size-3 text-muted-foreground" />
      ) : (
        <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </div>
  );
  return external ? (
    <Link href={href} target="_top">
      {content}
    </Link>
  ) : (
    <Link href={href}>{content}</Link>
  );
}

// ─────────────────────────────────────────────────────────
// 7 天用量看板
// ─────────────────────────────────────────────────────────
function UsagePanel({
  logs,
  status,
}: {
  logs: LogRow[] | null;
  status: SiteStatus | null;
}) {
  const buckets = useMemo(() => bucketByDay(logs || [], 7), [logs]);
  const topModels = useMemo(() => aggregateByModel(logs || [], 5), [logs]);
  const totalQuota = buckets.reduce((s, b) => s + b.quota, 0);
  const totalRequests = buckets.reduce((s, b) => s + b.requests, 0);

  const isLoading = logs === null;
  const isEmpty = !isLoading && (logs?.length ?? 0) === 0;

  return (
    <div className="mb-10 grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-[1.6fr_1fr]">
      {/* 左:折线图 */}
      <div className="bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LineChart className="size-4 text-brand" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
              7 天用量
            </h2>
          </div>
          <Link
            href="/console/log"
            className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-brand"
          >
            查看全部 →
          </Link>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center font-mono text-xs text-muted-foreground">
            loading…
          </div>
        ) : isEmpty ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
            <TrendingUp className="size-5 text-muted-foreground/40" />
            最近 7 天暂无消费记录
          </div>
        ) : (
          <>
            <Sparkline buckets={buckets} />
            <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border md:max-w-md">
              <MiniStat label="本周消费" value={formatUsd(totalQuota, status)} sub={formatRmbHint(totalQuota, status)} accent />
              <MiniStat label="本周请求" value={totalRequests.toLocaleString()} />
            </div>
          </>
        )}
      </div>

      {/* 右:Top 模型 */}
      <div className="bg-background p-6">
        <div className="mb-4 flex items-center gap-3">
          <Activity className="size-4 text-brand" />
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
            模型 Top 5
          </h2>
        </div>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center font-mono text-xs text-muted-foreground">
            loading…
          </div>
        ) : topModels.length === 0 ? (
          <div className="flex h-40 items-center justify-center font-mono text-xs text-muted-foreground">
            暂无模型用量
          </div>
        ) : (
          <ul className="space-y-2">
            {topModels.map((m) => {
              const ratio = totalQuota > 0 ? m.quota / totalQuota : 0;
              return (
                <li key={m.model} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="truncate text-foreground">{m.model}</span>
                    <span className="text-muted-foreground">
                      {formatUsd(m.quota, status)}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-secondary/60">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${Math.max(2, ratio * 100).toFixed(1)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-base font-semibold",
          accent ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function bucketByDay(logs: LogRow[], days: number) {
  const out: { day: string; quota: number; requests: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400 * 1000;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * dayMs);
    out.push({
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      quota: 0,
      requests: 0,
    });
  }
  for (const log of logs) {
    const t = new Date(log.created_at * 1000);
    t.setHours(0, 0, 0, 0);
    const idx = days - 1 - Math.floor((today.getTime() - t.getTime()) / dayMs);
    if (idx < 0 || idx >= days) continue;
    out[idx].quota += log.quota || 0;
    out[idx].requests += 1;
  }
  return out;
}

function aggregateByModel(logs: LogRow[], limit: number) {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (!log.model_name) continue;
    map.set(log.model_name, (map.get(log.model_name) || 0) + (log.quota || 0));
  }
  return Array.from(map.entries())
    .map(([model, quota]) => ({ model, quota }))
    .sort((a, b) => b.quota - a.quota)
    .slice(0, limit);
}

function Sparkline({
  buckets,
}: {
  buckets: { day: string; quota: number; requests: number }[];
}) {
  const W = 600;
  const H = 140;
  const pad = { l: 36, r: 12, t: 8, b: 22 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const maxQuota = Math.max(1, ...buckets.map((b) => b.quota));
  const step = buckets.length > 1 ? innerW / (buckets.length - 1) : innerW;

  const points = buckets.map((b, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - (b.quota / maxQuota) * innerH;
    return { x, y, b };
  });
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)},${pad.t + innerH} L${points[0].x.toFixed(1)},${pad.t + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="7 天用量折线"
      className="h-40 w-full"
    >
      <defs>
        <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格 */}
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * (1 - t);
        return (
          <line
            key={t}
            x1={pad.l}
            x2={W - pad.r}
            y1={y}
            y2={y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
        );
      })}
      <path d={areaPath} fill="url(#usageFill)" />
      <path
        d={path}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <g key={`${p.x}-${p.y}`}>
          <circle cx={p.x} cy={p.y} r={2.5} fill="var(--brand)" />
        </g>
      ))}
      {/* X 轴标签 */}
      {points.map((p, i) => (
        <text
          key={p.b.day + i}
          x={p.x}
          y={H - 6}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[10px]"
        >
          {p.b.day}
        </text>
      ))}
    </svg>
  );
}
