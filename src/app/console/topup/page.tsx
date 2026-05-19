"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Gift,
  History,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";

import { FormError, FormSuccess } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  api,
  type SiteStatus,
  type TopUpInfo,
  type TopUpRecord,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

import { formatRmbHint, formatUsd } from "@/lib/format-quota";

function formatTime(unix: number): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString("zh-CN");
}

const STATUS_META: Record<
  string,
  { label: string; icon: typeof CheckCircle2; cls: string }
> = {
  success: { label: "已完成", icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  pending: { label: "处理中", icon: Clock, cls: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10" },
  failed: { label: "失败", icon: XCircle, cls: "text-destructive border-destructive/30 bg-destructive/10" },
  cancelled: { label: "已取消", icon: XCircle, cls: "text-muted-foreground border-border bg-secondary" },
};

export default function TopUpPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [info, setInfo] = useState<TopUpInfo | null>(null);
  const [history, setHistory] = useState<TopUpRecord[]>([]);

  // 兑换码
  const [code, setCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  // 在线充值
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [previewMoney, setPreviewMoney] = useState<number | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  // 未登录跳走
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/login?redirect=/console/topup");
    }
  }, [authLoading, user]);

  useEffect(() => {
    api.status().then((r) => r.success && r.data && setStatus(r.data));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.topupInfo().then((r) => {
      if (r.success && r.data) {
        setInfo(r.data);
        // 默认选第一个支付方式
        if (r.data.pay_methods?.length && !selectedMethod) {
          setSelectedMethod(r.data.pay_methods[0].type);
        }
      }
    });
    api.topupHistory().then((r) => {
      if (r.success && r.data) setHistory(r.data.slice(0, 8));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 金额变化时算实付
  useEffect(() => {
    if (amount <= 0) {
      setPreviewMoney(null);
      return;
    }
    let cancelled = false;
    api.topupAmount(amount).then((r) => {
      if (cancelled) return;
      if (r.success && r.data) setPreviewMoney(r.data.pay_money);
    });
    return () => {
      cancelled = true;
    };
  }, [amount]);

  const discountEntries = useMemo(() => {
    if (!info?.discount) return [] as { amount: number; ratio: number }[];
    return Object.entries(info.discount)
      .map(([k, v]) => ({ amount: Number(k), ratio: Number(v) }))
      .filter((d) => !Number.isNaN(d.amount))
      .sort((a, b) => a.amount - b.amount);
  }, [info]);

  async function submitRedeem(e: React.FormEvent) {
    e.preventDefault();
    setRedeemError("");
    setRedeemSuccess("");
    if (!code.trim()) {
      setRedeemError("请输入兑换码");
      return;
    }
    setRedeemLoading(true);
    const r = await api.topupRedeem(code.trim());
    setRedeemLoading(false);
    if (!r.success) {
      setRedeemError(r.message || "兑换失败");
      return;
    }
    setRedeemSuccess(
      `兑换成功!到账 ${formatUsd(r.data || 0, status)}(${formatRmbHint(r.data || 0, status)})。页面将在 2 秒后刷新。`,
    );
    setCode("");
    setTimeout(() => window.location.reload(), 2000);
  }

  async function submitPay() {
    setPayError("");
    if (!info) {
      setPayError("支付配置未加载");
      return;
    }
    if (amount < info.min_topup) {
      setPayError(`最低充值 ¥${info.min_topup}`);
      return;
    }
    if (!selectedMethod) {
      setPayError("请选择支付方式");
      return;
    }
    setPayLoading(true);
    const r = await api.topupRequestEpay(amount, selectedMethod);
    setPayLoading(false);
    if (r.message !== "success") {
      setPayError(typeof r.data === "string" ? r.data : "拉起支付失败");
      return;
    }
    if (!r.url) {
      setPayError("未返回支付链接");
      return;
    }
    // 构造一个隐藏 form,POST 到 url 带上 data 里的所有字段
    const form = document.createElement("form");
    form.method = "POST";
    form.action = r.url;
    form.target = "_blank";
    if (r.data && typeof r.data === "object") {
      for (const [k, v] of Object.entries(r.data)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      }
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

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
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/console"
              className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-brand"
            >
              <ArrowLeft className="size-3" />
              返回控制台
            </Link>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
              TOPUP · 充值
            </div>
            <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
              账户充值
            </h1>
          </div>
          <div className="border border-border bg-secondary/40 px-5 py-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              当前余额
            </div>
            <div className="font-mono text-2xl font-semibold text-brand md:text-3xl">
              {formatUsd(user.quota, status)}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {formatRmbHint(user.quota, status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* 左:充值方式 */}
          <div className="space-y-6">
            {/* 兑换码 */}
            <div className="border border-border bg-background">
              <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                <Gift className="size-4 text-brand" />
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
                  兑换码兑换
                </h2>
              </div>
              <form onSubmit={submitRedeem} className="space-y-4 p-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="redeem"
                    className="font-mono text-[11px] uppercase tracking-wider"
                  >
                    兑换码
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="redeem"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="粘贴兑换码"
                      className="font-mono flex-1"
                      disabled={redeemLoading}
                    />
                    <Button
                      type="submit"
                      className="font-mono"
                      disabled={redeemLoading || !code.trim()}
                    >
                      {redeemLoading ? "兑换中…" : "兑换"}
                    </Button>
                  </div>
                </div>
                <FormError message={redeemError} />
                <FormSuccess message={redeemSuccess} />
              </form>
            </div>

            {/* 在线充值 */}
            {info && info.pay_methods?.length > 0 ? (
              <div className="border border-border bg-background">
                <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                  <CreditCard className="size-4 text-brand" />
                  <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
                    在线充值
                  </h2>
                </div>
                <div className="space-y-6 p-6">
                  {/* 金额预设 */}
                  {info.amount_options && info.amount_options.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] uppercase tracking-wider">
                        快捷金额
                      </Label>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {info.amount_options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAmount(opt)}
                            className={cn(
                              "border px-3 py-2 font-mono text-sm transition-colors",
                              amount === opt
                                ? "border-brand bg-brand/10 text-brand"
                                : "border-border bg-background text-foreground hover:border-brand/50",
                            )}
                          >
                            ¥{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 自定义金额 */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="amount"
                      className="font-mono text-[11px] uppercase tracking-wider"
                    >
                      自定义金额(最低 ¥{info.min_topup})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min={info.min_topup}
                      value={amount || ""}
                      onChange={(e) =>
                        setAmount(Math.max(0, Number(e.target.value)))
                      }
                      placeholder={`¥${info.min_topup}`}
                      className="font-mono text-lg"
                    />
                    {previewMoney !== null && amount >= info.min_topup ? (
                      <div className="font-mono text-xs text-muted-foreground">
                        实付 ¥{previewMoney.toFixed(2)}
                        {previewMoney < amount ? (
                          <span className="ml-1 text-brand">
                            (省 ¥{(amount - previewMoney).toFixed(2)})
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* 阶梯折扣展示 */}
                  {discountEntries.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] uppercase tracking-wider">
                        <Sparkles className="mr-1 inline size-3 text-brand" />
                        阶梯折扣
                      </Label>
                      <div className="border border-border bg-secondary/40 p-3 font-mono text-xs">
                        {discountEntries.map((d) => (
                          <div
                            key={d.amount}
                            className="flex items-center justify-between py-0.5"
                          >
                            <span>¥{d.amount} 起</span>
                            <span className="text-brand">
                              {(d.ratio * 100).toFixed(0)} 折
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* 支付方式 */}
                  <div className="space-y-2">
                    <Label className="font-mono text-[11px] uppercase tracking-wider">
                      支付方式
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {info.pay_methods.map((m) => (
                        <button
                          key={m.type}
                          type="button"
                          onClick={() => setSelectedMethod(m.type)}
                          className={cn(
                            "flex items-center justify-center gap-2 border px-3 py-2 font-mono text-sm transition-colors",
                            selectedMethod === m.type
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-border bg-background text-foreground hover:border-brand/50",
                          )}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <FormError message={payError} />

                  <Button
                    size="lg"
                    className="w-full font-mono"
                    onClick={submitPay}
                    disabled={
                      payLoading ||
                      amount < info.min_topup ||
                      !selectedMethod
                    }
                  >
                    {payLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        正在拉起支付…
                      </>
                    ) : (
                      <>
                        <CreditCard />
                        去支付
                        {previewMoney !== null
                          ? ` ¥${previewMoney.toFixed(2)}`
                          : amount > 0
                            ? ` ¥${amount}`
                            : ""}
                      </>
                    )}
                  </Button>

                  <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/70">
                    支付完成后页面会自动刷新余额。如有问题联系在线客服。
                  </div>
                </div>
              </div>
            ) : null}

            {/* 充值入口已禁用 */}
            {info && info.pay_methods?.length === 0 && !info.topup_link ? (
              <div className="border border-border bg-secondary/40 p-6 font-mono text-sm text-muted-foreground">
                管理员暂未开启在线充值,请使用兑换码或联系客服。
              </div>
            ) : null}
          </div>

          {/* 右:历史 */}
          <div className="border border-border bg-background">
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <History className="size-4 text-brand" />
              <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
                充值记录
              </h2>
            </div>
            {history.length === 0 ? (
              <div className="px-6 py-12 text-center font-mono text-sm text-muted-foreground">
                暂无充值记录
              </div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((rec) => {
                  const meta =
                    STATUS_META[rec.status] || STATUS_META.cancelled;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={rec.id}
                      className="space-y-1.5 px-6 py-4 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-base font-semibold text-foreground">
                          ¥{rec.money?.toFixed(2) ?? rec.amount}
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                            meta.cls,
                          )}
                        >
                          <Icon className="size-3" />
                          {meta.label}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {rec.payment_method || "兑换码"} ·{" "}
                        {formatTime(rec.create_time)}
                      </div>
                      {rec.trade_no ? (
                        <div className="truncate font-mono text-[10px] text-muted-foreground/70">
                          {rec.trade_no}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="border-t border-border px-6 py-3">
              <Link
                href="/console/log"
                target="_top"
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-brand hover:underline"
              >
                查看完整账单与日志 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
