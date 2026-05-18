"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CircleDollarSign,
  Copy,
  ExternalLink,
  KeyRound,
  ListChecks,
  Plus,
  ReceiptText,
  Settings,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  api,
  type SelfUser,
  type SiteStatus,
  type TokenRow,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

const DEFAULT_QUOTA_PER_UNIT = 500000;
const DEFAULT_USD_RATE = 1; // 你站固定 1 USD = 1 ¥(0.46 充值比例下,扣的 USD = 显示金额)

function formatRmb(quota: number, status: SiteStatus | null): string {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  const rate = status?.usd_exchange_rate || DEFAULT_USD_RATE;
  const usd = quota / perUnit;
  const cny = usd * rate;
  if (cny >= 100) return `¥${cny.toFixed(0)}`;
  if (cny >= 10) return `¥${cny.toFixed(1)}`;
  return `¥${cny.toFixed(2)}`;
}

function formatRmbFull(quota: number, status: SiteStatus | null): string {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  const rate = status?.usd_exchange_rate || DEFAULT_USD_RATE;
  const usd = quota / perUnit;
  return `¥${(usd * rate).toFixed(4)}`;
}

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

  useEffect(() => {
    // 公开,即使未登录也能拉
    api.status().then((r) => {
      if (r.success && r.data) setStatus(r.data);
    });
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
            value={formatRmb(user.quota, status)}
            sub={formatRmbFull(user.quota, status)}
            highlight
          />
          <Stat
            icon={ReceiptText}
            label="累计消耗"
            value={formatRmb(user.used_quota, status)}
            sub={`${user.request_count.toLocaleString()} 次请求`}
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
            value={formatRmb(user.aff_history_quota || 0, status)}
            sub={`${user.aff_count || 0} 人已注册`}
          />
        </div>

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
              external
            />
            <QuickLink
              icon={ListChecks}
              label="使用日志"
              href="/console/log"
              external
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
              external
            />
          </div>
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
            {formatRmb(token.remain_quota, status)}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            余额 / 已用 {formatRmb(token.used_quota, status)}
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
