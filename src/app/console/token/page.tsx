"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { FormError, FormSuccess } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  api,
  type SiteStatus,
  type TokenCreatePayload,
  type TokenRow,
  type TokenUpdatePayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { groupLabel, type PricingPayload } from "@/lib/pricing";

import { DEFAULT_QUOTA_PER_UNIT, formatRmbHint, formatUsd } from "@/lib/format-quota";

/** 从 PricingPayload 算出默认分组:有 "默认分组" 标记的优先,否则第一个 */
function defaultGroupName(pricing: PricingPayload | null): string {
  if (!pricing) return "";
  const marked = Object.entries(pricing.usable_group).find(
    ([, desc]) => desc === "默认分组",
  );
  if (marked) return marked[0];
  return Object.keys(pricing.group_ratio)[0] ?? "";
}

/** USD 数字 → quota int(创建/编辑 token 时输入额度用) */
function usdToQuota(usd: number, status: SiteStatus | null): number {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  return Math.round(usd * perUnit);
}

function formatTime(unix: number): string {
  if (!unix || unix < 0) return "永不过期";
  return new Date(unix * 1000).toLocaleString("zh-CN");
}

const EXPIRY_PRESETS = [
  { label: "永不过期", days: -1 },
  { label: "1 天", days: 1 },
  { label: "7 天", days: 7 },
  { label: "30 天", days: 30 },
  { label: "90 天", days: 90 },
] as const;

export default function TokenPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [pricing, setPricing] = useState<PricingPayload | null>(null);

  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [topError, setTopError] = useState("");

  // create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TokenRow | null>(null);

  // delete confirm dialog
  const [deletingToken, setDeletingToken] = useState<TokenRow | null>(null);

  // reveal key dialog
  const [revealed, setRevealed] = useState<{
    row: TokenRow;
    fullKey: string;
  } | null>(null);

  // 未登录跳走
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/login?redirect=/console/token");
    }
  }, [authLoading, user]);

  useEffect(() => {
    api.status().then((r) => r.success && r.data && setStatus(r.data));
    api.pricing().then((p) => p && setPricing(p));
  }, []);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setTopError("");
    const r = keyword.trim()
      ? await api.tokenSearch(keyword.trim())
      : await api.tokens(page, pageSize);
    setLoading(false);
    if (!r.success) {
      setTopError(r.message || "加载失败");
      return;
    }
    setTokens(r.data?.items || []);
    setTotal(r.data?.total || 0);
  }, [page, pageSize, keyword]);

  useEffect(() => {
    if (!user) return;
    fetchTokens();
  }, [user, fetchTokens]);

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
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/console"
              className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-brand"
            >
              <ArrowLeft className="size-3" />
              返回控制台
            </Link>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              TOKENS · API 令牌管理
            </div>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
              我的 API Token
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              共 {total} 个 · 用于调用 /v1/chat/completions 接口
            </p>
          </div>
          <Button
            className="font-mono"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus />
            创建 Token
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex items-center gap-3 border border-border bg-secondary/30 p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="按名称搜索"
              className="h-9 pl-9 font-mono text-sm"
            />
          </div>
        </div>

        {topError ? (
          <div className="mb-6">
            <FormError message={topError} />
          </div>
        ) : null}

        {/* Table */}
        <div className="border border-border bg-background">
          {/* Column header (desktop) */}
          <div className="hidden grid-cols-[1.8fr_1.2fr_1.1fr_0.8fr_0.9fr_0.9fr_auto] items-center gap-4 border-b border-border bg-secondary/40 px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
            <div>名称 / Key</div>
            <div>余额 / 已用</div>
            <div>分组</div>
            <div>状态</div>
            <div>创建时间</div>
            <div>过期时间</div>
            <div className="text-right">操作</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 font-mono text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              loading…
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <KeyRound className="size-8 text-muted-foreground/60" />
              <div className="font-mono text-sm text-muted-foreground">
                {keyword ? "没有匹配的 token" : "你还没创建 API Token"}
              </div>
              {!keyword ? (
                <Button
                  className="font-mono"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  <Plus />
                  创建第一个 Token
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tokens.map((tok) => (
                <TokenItem
                  key={tok.id}
                  token={tok}
                  status={status}
                  pricing={pricing}
                  onReveal={async () => {
                    const r = await api.tokenGetKey(tok.id);
                    if (r.success && r.data?.key) {
                      setRevealed({ row: tok, fullKey: r.data.key });
                    } else {
                      setTopError(r.message || "获取 key 失败");
                    }
                  }}
                  onEdit={() => {
                    setEditing(tok);
                    setDialogOpen(true);
                  }}
                  onToggle={async () => {
                    const r = await api.tokenToggleStatus(
                      tok.id,
                      tok.status === 1 ? 2 : 1,
                    );
                    if (!r.success) {
                      setTopError(r.message || "切换失败");
                      return;
                    }
                    fetchTokens();
                  }}
                  onDelete={() => setDeletingToken(tok)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!keyword && total > pageSize ? (
            <div className="flex items-center justify-between border-t border-border px-6 py-3 font-mono text-xs text-muted-foreground">
              <span>
                第 {page + 1} / {Math.ceil(total / pageSize)} 页
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="font-mono"
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="font-mono"
                >
                  下一页
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create / Edit dialog */}
      <TokenFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        status={status}
        pricing={pricing}
        onSaved={() => {
          setDialogOpen(false);
          setEditing(null);
          fetchTokens();
        }}
      />

      {/* Delete confirm */}
      <DeleteConfirmDialog
        token={deletingToken}
        onOpenChange={(o) => !o && setDeletingToken(null)}
        onConfirmed={async () => {
          if (!deletingToken) return;
          const r = await api.tokenDelete(deletingToken.id);
          if (!r.success) {
            setTopError(r.message || "删除失败");
          }
          setDeletingToken(null);
          fetchTokens();
        }}
      />

      {/* Reveal key */}
      <RevealKeyDialog
        data={revealed}
        onOpenChange={(o) => !o && setRevealed(null)}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────
function TokenItem({
  token,
  status,
  pricing,
  onReveal,
  onEdit,
  onToggle,
  onDelete,
}: {
  token: TokenRow;
  status: SiteStatus | null;
  pricing: PricingPayload | null;
  onReveal: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const enabled = token.status === 1;
  // 取分组的显示名 + 倍率(用于行内徽章)
  const groupName = token.group?.trim();
  const groupRatio =
    groupName && pricing ? pricing.group_ratio[groupName] : undefined;
  const displayedGroup = groupName ? groupLabel(groupName) : null;
  const modelLimitCount =
    token.model_limits_enabled && token.model_limits
      ? token.model_limits.split(",").filter((s) => s.trim()).length
      : 0;

  return (
    <div className="grid grid-cols-2 items-center gap-3 px-6 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-[1.8fr_1.2fr_1.1fr_0.8fr_0.9fr_0.9fr_auto] md:gap-4">
      {/* 名称 / key */}
      <div className="col-span-2 min-w-0 md:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-mono text-sm font-medium text-foreground">
            {token.name || `Token #${token.id}`}
          </span>
          {token.unlimited_quota ? (
            <span className="border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
              无限额
            </span>
          ) : null}
        </div>
        <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          sk-{token.key}
        </div>
      </div>

      {/* 余额 */}
      <div>
        <div className="font-mono text-xs text-muted-foreground md:hidden">
          余额
        </div>
        <div className="font-mono text-sm font-medium text-foreground">
          {token.unlimited_quota ? "—" : formatUsd(token.remain_quota, status)}
        </div>
        {!token.unlimited_quota ? (
          <div className="font-mono text-[10px] text-muted-foreground">
            {formatRmbHint(token.remain_quota, status)}
          </div>
        ) : null}
        <div className="font-mono text-[10px] text-muted-foreground/70">
          已用 {formatUsd(token.used_quota, status)}
        </div>
      </div>

      {/* 分组 */}
      <div>
        <div className="font-mono text-xs text-muted-foreground md:hidden">
          分组
        </div>
        {displayedGroup ? (
          <>
            <div
              className="font-mono text-sm font-medium text-foreground"
              title={groupName ? `后端分组名:${groupName}` : undefined}
            >
              {displayedGroup}
            </div>
            {groupRatio !== undefined ? (
              <div className="font-mono text-[10px] text-muted-foreground">
                倍率 ×{groupRatio}
              </div>
            ) : null}
            {token.model_limits_enabled ? (
              <div
                className="mt-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-500"
                title={token.model_limits || ""}
              >
                限 {modelLimitCount} 个模型
              </div>
            ) : null}
          </>
        ) : (
          <div className="font-mono text-sm text-muted-foreground">—</div>
        )}
      </div>

      {/* 状态 */}
      <div>
        <div className="font-mono text-xs text-muted-foreground md:hidden">
          状态
        </div>
        <span
          className={cn(
            "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            enabled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          {enabled ? "启用" : "已禁用"}
        </span>
      </div>

      {/* 创建时间 */}
      <div className="font-mono text-xs text-muted-foreground">
        <div className="md:hidden text-muted-foreground/70">创建</div>
        {new Date(token.created_time * 1000).toLocaleDateString("zh-CN")}
      </div>

      {/* 过期时间 */}
      <div className="font-mono text-xs text-muted-foreground">
        <div className="md:hidden text-muted-foreground/70">过期</div>
        {token.expired_time < 0
          ? "永不过期"
          : new Date(token.expired_time * 1000).toLocaleDateString("zh-CN")}
      </div>

      {/* 操作 */}
      <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onReveal}
          title="查看完整 key"
        >
          <Eye />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="更多操作">
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="font-mono">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 size-3.5" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              <KeyRound className="mr-2 size-3.5" />
              {enabled ? "禁用" : "启用"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-3.5" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
function TokenFormDialog({
  open,
  onOpenChange,
  editing,
  status,
  pricing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: TokenRow | null;
  status: SiteStatus | null;
  pricing: PricingPayload | null;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [name, setName] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [usdQuota, setUsdQuota] = useState<number>(10);
  const [expiryDays, setExpiryDays] = useState<number>(-1);
  const [group, setGroup] = useState<string>("");
  const [limitModels, setLimitModels] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groupOptions = useMemo(() => {
    if (!pricing) return [] as { name: string; ratio: number; label: string }[];
    return Object.entries(pricing.group_ratio).map(([n, r]) => ({
      name: n,
      ratio: r,
      label: groupLabel(n),
    }));
  }, [pricing]);

  // 当前 group 下的可选模型(去重),用于"限制模型"chip 列表
  const groupModels = useMemo(() => {
    if (!pricing || !group) return [] as string[];
    const set = new Set<string>();
    for (const m of pricing.data) {
      if (m.enable_groups?.includes(group)) set.add(m.model_name);
    }
    return Array.from(set).sort();
  }, [pricing, group]);

  // 搜索过滤后的可选模型(只用于渲染)
  const visibleModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return groupModels;
    return groupModels.filter((m) => m.toLowerCase().includes(q));
  }, [groupModels, modelSearch]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setUnlimited(editing.unlimited_quota);
      setUsdQuota(
        editing.unlimited_quota
          ? 10
          : Math.round(
              (editing.remain_quota / (status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT)) * 100,
            ) / 100,
      );
      // expiry days — compute from expired_time
      if (editing.expired_time < 0) {
        setExpiryDays(-1);
      } else {
        const secondsLeft = editing.expired_time - Math.floor(Date.now() / 1000);
        const days = Math.max(1, Math.round(secondsLeft / 86400));
        setExpiryDays(days);
      }
      setGroup(editing.group || defaultGroupName(pricing));
      setLimitModels(!!editing.model_limits_enabled);
      setSelectedModels(
        editing.model_limits
          ? editing.model_limits.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      );
    } else {
      setName("");
      setUnlimited(false);
      setUsdQuota(10);
      setExpiryDays(-1);
      setGroup(defaultGroupName(pricing));
      setLimitModels(false);
      setSelectedModels([]);
    }
    setModelSearch("");
    setError("");
  }, [open, editing, status, pricing]);

  async function submit() {
    setError("");
    if (!name.trim()) {
      setError("请填写名称");
      return;
    }
    // 限制模式开启但一个都没选 = 等于全禁,先拦下来
    if (limitModels && selectedModels.length === 0) {
      setError("已开启模型限制但未选择任何模型,该 Token 将无法调用任何模型");
      return;
    }
    setSaving(true);
    const remainQuota = unlimited ? 0 : usdToQuota(usdQuota, status);
    const expiredTime =
      expiryDays < 0
        ? -1
        : Math.floor(Date.now() / 1000) + expiryDays * 86400;
    // 限制关闭时不传 model_limits,后端按 unlimited 走
    const modelLimitsStr = limitModels ? selectedModels.join(",") : "";

    let r;
    if (isEdit && editing) {
      const payload: TokenUpdatePayload = {
        id: editing.id,
        name: name.trim(),
        unlimited_quota: unlimited,
        remain_quota: remainQuota,
        expired_time: expiredTime,
        status: editing.status,
        group: group || undefined,
        model_limits_enabled: limitModels,
        model_limits: modelLimitsStr,
      };
      r = await api.tokenUpdate(payload);
    } else {
      const payload: TokenCreatePayload = {
        name: name.trim(),
        unlimited_quota: unlimited,
        remain_quota: remainQuota,
        expired_time: expiredTime,
        group: group || undefined,
        model_limits_enabled: limitModels,
        model_limits: modelLimitsStr,
      };
      r = await api.tokenCreate(payload);
    }
    setSaving(false);
    if (!r.success) {
      setError(r.message || "保存失败");
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {isEdit ? "编辑 Token" : "创建新 Token"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {isEdit
              ? `修改 ${editing?.name || `#${editing?.id}`} 的配置`
              : "Token 是调用 API 的凭证，请妥善保管"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tok_name" className="font-mono text-[11px] uppercase tracking-wider">
              名称
            </Label>
            <Input
              id="tok_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="font-mono"
              placeholder="例如:生产环境 / 个人测试"
              disabled={saving}
            />
          </div>

          {groupOptions.length > 0 ? (
            <div className="space-y-2">
              <Label className="font-mono text-[11px] uppercase tracking-wider">
                分组
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {groupOptions.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setGroup(g.name)}
                    className={cn(
                      "border px-2 py-1.5 text-left font-mono text-xs transition-colors",
                      group === g.name
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-background text-foreground hover:border-brand/50",
                    )}
                    disabled={saving}
                    title={`${g.name} · ×${g.ratio}`}
                  >
                    <span className="block truncate">{g.label}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      ×{g.ratio}
                    </span>
                  </button>
                ))}
              </div>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                同一模型在不同分组下倍率不同，调用时按 token 绑定的分组扣费。
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider">
              额度
            </Label>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={unlimited}
                  onChange={(e) => setUnlimited(e.target.checked)}
                  disabled={saving}
                />
                无限额(共享账户余额)
              </label>
            </div>
            {!unlimited ? (
              <div className="mt-2 space-y-1.5">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={usdQuota || ""}
                    onChange={(e) => setUsdQuota(Math.max(0, Number(e.target.value)))}
                    placeholder="10"
                    className="pl-7 font-mono"
                    disabled={saving}
                  />
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {formatRmbHint(usdToQuota(usdQuota, status), status)} · {usdToQuota(usdQuota, status).toLocaleString()} 配额
                </div>
              </div>
            ) : null}
          </div>

          {groupModels.length > 0 ? (
            <div className="space-y-2">
              <Label className="font-mono text-[11px] uppercase tracking-wider">
                可用模型
              </Label>
              <label className="flex cursor-pointer items-center gap-1.5 font-mono text-xs">
                <input
                  type="checkbox"
                  checked={limitModels}
                  onChange={(e) => setLimitModels(e.target.checked)}
                  disabled={saving}
                />
                限制此 Token 可调用的模型(白名单)
              </label>
              {limitModels ? (
                <div className="space-y-2 border border-border bg-secondary/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder={`搜索模型(共 ${groupModels.length} 个)`}
                      className="h-8 font-mono text-xs"
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 font-mono text-xs"
                      onClick={() =>
                        setSelectedModels(
                          selectedModels.length === groupModels.length
                            ? []
                            : [...groupModels],
                        )
                      }
                      disabled={saving}
                    >
                      {selectedModels.length === groupModels.length
                        ? "清空"
                        : "全选"}
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {visibleModels.length === 0 ? (
                        <span className="px-1 py-2 font-mono text-[11px] text-muted-foreground">
                          没有匹配的模型
                        </span>
                      ) : (
                        visibleModels.map((m) => {
                          const on = selectedModels.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() =>
                                setSelectedModels((prev) =>
                                  on
                                    ? prev.filter((x) => x !== m)
                                    : [...prev, m],
                                )
                              }
                              disabled={saving}
                              className={cn(
                                "border px-2 py-1 font-mono text-[11px] transition-colors",
                                on
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-border bg-background text-foreground hover:border-brand/50",
                              )}
                            >
                              {m}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                    已选 {selectedModels.length} / {groupModels.length} ·
                    切换分组后,该分组以外的模型仍保留在列表里(仅展示当前分组)。
                  </p>
                </div>
              ) : (
                <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                  不限制 = 该分组下所有模型都能用,后续后台上新会自动生效。
                </p>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider">
              过期时间
            </Label>
            <div className="grid grid-cols-5 gap-1">
              {EXPIRY_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setExpiryDays(p.days)}
                  className={cn(
                    "border px-2 py-1.5 font-mono text-xs transition-colors",
                    expiryDays === p.days
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-background text-foreground hover:border-brand/50",
                  )}
                  disabled={saving}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <FormError message={error} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="font-mono"
          >
            取消
          </Button>
          <Button onClick={submit} disabled={saving} className="font-mono">
            {saving ? "保存中…" : isEdit ? "保存修改" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
function DeleteConfirmDialog({
  token,
  onOpenChange,
  onConfirmed,
}: {
  token: TokenRow | null;
  onOpenChange: (o: boolean) => void;
  onConfirmed: () => void;
}) {
  return (
    <Dialog open={!!token} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono">删除 Token?</DialogTitle>
          <DialogDescription className="font-mono text-xs leading-relaxed">
            <strong className="text-foreground">
              {token?.name || `Token #${token?.id}`}
            </strong>{" "}
            将被永久删除。正在使用此 key 的客户端会立刻调用失败，该操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmed}
            className="font-mono"
          >
            <Trash2 />
            确定删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────
function RevealKeyDialog({
  data,
  onOpenChange,
}: {
  data: { row: TokenRow; fullKey: string } | null;
  onOpenChange: (o: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const displayKey = useMemo(
    () => (data?.fullKey?.startsWith("sk-") ? data.fullKey : `sk-${data?.fullKey || ""}`),
    [data],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(displayKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  useEffect(() => {
    if (!data) setCopied(false);
  }, [data]);

  return (
    <Dialog open={!!data} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {data?.row.name || `Token #${data?.row.id}`} · 完整 Key
          </DialogTitle>
          <DialogDescription className="font-mono text-xs leading-relaxed">
            这是该 token 的完整 API key,请妥善保存。
            <strong className="text-foreground"> 关闭弹窗后将无法再次查看(必须重新点击眼睛图标)</strong>。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <FormSuccess message={copied ? "✓ 已复制到剪贴板" : ""} />
          <div className="break-all border border-border bg-secondary/50 p-4 font-mono text-sm text-foreground">
            {displayKey}
          </div>
          <Button onClick={copy} size="lg" className="w-full font-mono">
            {copied ? <Check /> : <Copy />}
            {copied ? "已复制" : "复制完整 Key"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
