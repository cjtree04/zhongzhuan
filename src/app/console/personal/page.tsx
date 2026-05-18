"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  Copy,
  Gift,
  Loader2,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import { FormError, FormSuccess } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  api,
  clearAuthState,
  type SelfUser,
  type SiteStatus,
  type TwoFAStatus,
  type UserSettingPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";

const DEFAULT_QUOTA_PER_UNIT = 500000;
const DEFAULT_USD_RATE = 1;

function formatRmb(quota: number, status: SiteStatus | null): string {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  const rate = status?.usd_exchange_rate || DEFAULT_USD_RATE;
  const cny = (quota / perUnit) * rate;
  if (cny >= 100) return `¥${cny.toFixed(0)}`;
  if (cny >= 10) return `¥${cny.toFixed(1)}`;
  return `¥${cny.toFixed(2)}`;
}

export default function PersonalPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SiteStatus | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace("/login?redirect=/console/personal");
    }
  }, [authLoading, user]);

  useEffect(() => {
    api.status().then((r) => r.success && r.data && setStatus(r.data));
  }, []);

  if (authLoading || !user) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="mb-10">
          <Link
            href="/console"
            className="mb-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-brand"
          >
            <ArrowLeft className="size-3" />
            返回控制台
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand">
            PERSONAL · 个人设置
          </div>
          <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            账户与安全
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            用户 #{user.id} · {user.username}
            {user.role >= 10 ? (
              <span className="ml-2 inline-flex items-center border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-brand">
                ADMIN
              </span>
            ) : null}
          </p>
        </div>

        <div className="space-y-8">
          <ProfileSection user={user} />
          <SecuritySection />
          <NotificationSection />
          <AffiliateSection user={user} status={status} />
          <DangerZone />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  eyebrow,
  title,
  desc,
  children,
}: {
  icon: typeof UserCircle;
  eyebrow: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-background">
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <Icon className="mt-0.5 size-4 text-brand" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
            {eyebrow}
          </div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider">
            {title}
          </h2>
          {desc ? (
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// 资料区块
// ─────────────────────────────────────────────────────────
function ProfileSection({ user }: { user: SelfUser }) {
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!displayName.trim()) {
      setError("昵称不能为空");
      return;
    }
    setSaving(true);
    const r = await api.updateSelf({ display_name: displayName.trim() });
    setSaving(false);
    if (!r.success) {
      setError(r.message || "保存失败");
      return;
    }
    setSuccess("已保存");
  }

  return (
    <Section
      icon={UserCircle}
      eyebrow="PROFILE · 01"
      title="账户资料"
      desc="账户名一旦创建无法修改;昵称会显示在控制台和邀请页。"
    >
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider">
              用户名
            </Label>
            <Input
              value={user.username}
              disabled
              className="font-mono text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="display_name"
              className="font-mono text-[11px] uppercase tracking-wider"
            >
              昵称
            </Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              className="font-mono"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider">
              邮箱
            </Label>
            <Input
              value={user.email || "未绑定"}
              disabled
              className="font-mono text-muted-foreground"
            />
            <div className="font-mono text-[10px] text-muted-foreground/70">
              更换邮箱需邮箱验证码,接口已就绪,后续上线统一入口。
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-wider">
              用户组
            </Label>
            <Input
              value={user.group}
              disabled
              className="font-mono text-muted-foreground"
            />
          </div>
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        <div className="flex justify-end">
          <Button type="submit" className="font-mono" disabled={saving}>
            {saving ? "保存中…" : "保存昵称"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────
// 安全区块:改密码 + 2FA 状态
// ─────────────────────────────────────────────────────────
function SecuritySection() {
  return (
    <Section
      icon={ShieldCheck}
      eyebrow="SECURITY · 02"
      title="安全"
      desc="账号关键安全设置。修改密码需输入当前密码;2FA 开关需验证身份。"
    >
      <PasswordForm />
      <div className="border-t border-border pt-6">
        <TwoFAControl />
      </div>
    </Section>
  );
}

function PasswordForm() {
  const [original, setOriginal] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (pw1.length < 8) {
      setError("新密码至少 8 位");
      return;
    }
    if (pw1 !== pw2) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSaving(true);
    const r = await api.updateSelf({
      original_password: original,
      password: pw1,
    });
    setSaving(false);
    if (!r.success) {
      setError(r.message || "修改失败");
      return;
    }
    setSuccess("密码已更新,下次登录请使用新密码");
    setOriginal("");
    setPw1("");
    setPw2("");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        修改密码
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label
            htmlFor="cur_pw"
            className="font-mono text-[11px] uppercase tracking-wider"
          >
            当前密码
          </Label>
          <Input
            id="cur_pw"
            type="password"
            autoComplete="current-password"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="font-mono"
            disabled={saving}
            required
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="new_pw"
            className="font-mono text-[11px] uppercase tracking-wider"
          >
            新密码
          </Label>
          <Input
            id="new_pw"
            type="password"
            autoComplete="new-password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            minLength={8}
            className="font-mono"
            disabled={saving}
            required
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="new_pw2"
            className="font-mono text-[11px] uppercase tracking-wider"
          >
            再次输入
          </Label>
          <Input
            id="new_pw2"
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            minLength={8}
            className="font-mono"
            disabled={saving}
            required
          />
        </div>
      </div>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex justify-end">
        <Button
          type="submit"
          className="font-mono"
          disabled={saving || !original || !pw1 || !pw2}
        >
          {saving ? "保存中…" : "更新密码"}
        </Button>
      </div>
    </form>
  );
}

function TwoFAControl() {
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.twoFAStatus().then((r) => {
      if (r.success && r.data) setStatus(r.data);
      else setError(r.message || "未能读取 2FA 状态");
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-3">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        二次验证 · 2FA
      </div>
      {loading ? (
        <div className="font-mono text-sm text-muted-foreground">loading…</div>
      ) : error ? (
        <FormError message={error} />
      ) : status ? (
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="font-mono text-sm">
              当前状态:{" "}
              <span
                className={cn(
                  "ml-1 inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  status.enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-secondary text-muted-foreground",
                )}
              >
                {status.enabled ? "已开启" : "未开启"}
              </span>
            </div>
            {status.enabled ? (
              <div className="font-mono text-[11px] text-muted-foreground">
                剩余备份码 {status.backup_codes_remaining ?? "—"} 个
              </div>
            ) : (
              <div className="font-mono text-[11px] text-muted-foreground">
                建议开启 2FA,登录时除密码外还需输入手机 Authenticator 6 位动态码。
              </div>
            )}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground/80">
            2FA 启用/关闭流程在 New API 默认主题 personal 页操作,本前端暂未实现 setup UI。
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 通知区块
// ─────────────────────────────────────────────────────────
const NOTIFY_OPTIONS: { value: UserSettingPayload["notify_type"]; label: string; hint: string }[] = [
  { value: "email", label: "邮箱", hint: "默认走账户邮箱,可指定其他邮箱" },
  { value: "webhook", label: "Webhook", hint: "POST 自定义回调地址,可设 secret" },
  { value: "bark", label: "Bark", hint: "iOS 推送(填写 Bark URL)" },
  { value: "gotify", label: "Gotify", hint: "自建消息推送服务" },
];

function NotificationSection() {
  const [notifyType, setNotifyType] = useState<UserSettingPayload["notify_type"]>("email");
  const [threshold, setThreshold] = useState<number>(0);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [barkUrl, setBarkUrl] = useState("");
  const [gotifyUrl, setGotifyUrl] = useState("");
  const [gotifyToken, setGotifyToken] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (threshold <= 0) {
      setError("配额预警阈值必须大于 0");
      return;
    }
    const payload: UserSettingPayload = {
      notify_type: notifyType,
      quota_warning_threshold: threshold,
    };
    if (notifyType === "email") payload.notification_email = notificationEmail || undefined;
    if (notifyType === "webhook") {
      payload.webhook_url = webhookUrl;
      payload.webhook_secret = webhookSecret || undefined;
    }
    if (notifyType === "bark") payload.bark_url = barkUrl;
    if (notifyType === "gotify") {
      payload.gotify_url = gotifyUrl;
      payload.gotify_token = gotifyToken;
    }

    setSaving(true);
    const r = await api.updateSetting(payload);
    setSaving(false);
    if (!r.success) {
      setError(r.message || "保存失败");
      return;
    }
    setSuccess("通知偏好已更新");
  }

  return (
    <Section
      icon={Bell}
      eyebrow="NOTIFY · 03"
      title="通知与额度预警"
      desc="配额低于阈值时,系统会通过选定渠道提醒。"
    >
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label className="font-mono text-[11px] uppercase tracking-wider">
            通知渠道
          </Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NOTIFY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNotifyType(opt.value)}
                className={cn(
                  "border px-3 py-2 text-left font-mono text-sm transition-colors",
                  notifyType === opt.value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-background text-foreground hover:border-brand/50",
                )}
              >
                <div>{opt.label}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground/80">
                  {opt.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="threshold"
            className="font-mono text-[11px] uppercase tracking-wider"
          >
            配额预警阈值(token 单位)
          </Label>
          <Input
            id="threshold"
            type="number"
            min={1}
            value={threshold || ""}
            onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
            placeholder="例如 100000"
            className="font-mono"
            disabled={saving}
          />
          <div className="font-mono text-[10px] text-muted-foreground/70">
            余额低于此数值时,会按选定渠道触发一次通知。
          </div>
        </div>

        {notifyType === "email" ? (
          <div className="space-y-2">
            <Label
              htmlFor="notify_email"
              className="font-mono text-[11px] uppercase tracking-wider"
            >
              接收邮箱(留空则用账号邮箱)
            </Label>
            <Input
              id="notify_email"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              className="font-mono"
              disabled={saving}
              placeholder="alerts@example.com"
            />
          </div>
        ) : null}

        {notifyType === "webhook" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="hook_url"
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                Webhook URL
              </Label>
              <Input
                id="hook_url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="font-mono"
                disabled={saving}
                placeholder="https://example.com/hook"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="hook_secret"
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                Secret(可选)
              </Label>
              <Input
                id="hook_secret"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="font-mono"
                disabled={saving}
              />
            </div>
          </div>
        ) : null}

        {notifyType === "bark" ? (
          <div className="space-y-2">
            <Label
              htmlFor="bark_url"
              className="font-mono text-[11px] uppercase tracking-wider"
            >
              Bark URL
            </Label>
            <Input
              id="bark_url"
              type="url"
              value={barkUrl}
              onChange={(e) => setBarkUrl(e.target.value)}
              className="font-mono"
              disabled={saving}
              placeholder="https://api.day.app/<your-key>"
              required
            />
          </div>
        ) : null}

        {notifyType === "gotify" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="gotify_url"
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                Gotify URL
              </Label>
              <Input
                id="gotify_url"
                type="url"
                value={gotifyUrl}
                onChange={(e) => setGotifyUrl(e.target.value)}
                className="font-mono"
                disabled={saving}
                placeholder="https://gotify.example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="gotify_token"
                className="font-mono text-[11px] uppercase tracking-wider"
              >
                Gotify Token
              </Label>
              <Input
                id="gotify_token"
                value={gotifyToken}
                onChange={(e) => setGotifyToken(e.target.value)}
                className="font-mono"
                disabled={saving}
                required
              />
            </div>
          </div>
        ) : null}

        <FormError message={error} />
        <FormSuccess message={success} />

        <div className="flex justify-end">
          <Button type="submit" className="font-mono" disabled={saving}>
            {saving ? "保存中…" : "保存通知偏好"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────
// 邀请区块
// ─────────────────────────────────────────────────────────
function AffiliateSection({
  user,
  status,
}: {
  user: SelfUser;
  status: SiteStatus | null;
}) {
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined" && user.aff_code
      ? `${window.location.origin}/register?aff=${user.aff_code}`
      : "";

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function transfer() {
    setError("");
    setSuccess("");
    if (transferAmount <= 0) {
      setError("请填写要转入的额度");
      return;
    }
    if (transferAmount > user.aff_quota) {
      setError("超出可转额度");
      return;
    }
    setBusy(true);
    const r = await api.affTransfer(transferAmount);
    setBusy(false);
    if (!r.success) {
      setError(r.message || "转入失败");
      return;
    }
    setSuccess("已转入账户余额,刷新后生效");
    setTransferAmount(0);
  }

  return (
    <Section
      icon={Gift}
      eyebrow="AFFILIATE · 04"
      title="邀请奖励"
      desc="邀请新用户注册并完成首次充值后,你将获得奖励额度。"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            你的邀请码
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate border border-border bg-secondary/40 px-3 py-2 font-mono text-sm">
              {user.aff_code || "—"}
            </code>
            <Button
              type="button"
              variant="outline"
              className="font-mono"
              onClick={copyLink}
              disabled={!inviteLink}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "已复制" : "复制链接"}
            </Button>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground/70">
            {inviteLink || "登录后生成"}
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            奖励概览
          </div>
          <div className="grid grid-cols-2 gap-px border border-border bg-border">
            <Box label="已邀请用户" value={String(user.aff_count || 0)} />
            <Box label="累计奖励" value={formatRmb(user.aff_history_quota || 0, status)} />
            <Box label="可转入余额" value={formatRmb(user.aff_quota || 0, status)} accent />
            <Box label="状态" value="—" />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          转入账户余额
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            type="number"
            min={1}
            value={transferAmount || ""}
            onChange={(e) =>
              setTransferAmount(Math.max(0, Number(e.target.value)))
            }
            placeholder="输入要转入的额度(token 单位)"
            className="font-mono md:max-w-xs"
          />
          <Button
            type="button"
            className="font-mono"
            onClick={transfer}
            disabled={busy || transferAmount <= 0}
          >
            {busy ? "处理中…" : "转入余额"}
          </Button>
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">
          说明:若管理员未开启支付合规校验,本接口可能直接返回错误,请按提示处理。
        </div>
      </div>
    </Section>
  );
}

function Box({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-lg font-semibold",
          accent ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 危险区
// ─────────────────────────────────────────────────────────
function DangerZone() {
  const [confirmInput, setConfirmInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function destroy() {
    if (confirmInput !== "DELETE") {
      setError("请输入 DELETE 以确认操作");
      return;
    }
    setError("");
    setBusy(true);
    const r = await api.deleteSelf();
    setBusy(false);
    if (!r.success) {
      setError(r.message || "操作失败");
      return;
    }
    clearAuthState();
    window.location.replace("/");
  }

  return (
    <Section
      icon={AlertTriangle}
      eyebrow="DANGER · 05"
      title="注销账户"
      desc="软删除当前账户,所有 token 立刻失效。操作不可在前端撤销。"
    >
      <div className="space-y-3">
        <div className="font-mono text-[11px] text-muted-foreground">
          为防止误触,请在下方输入 <code className="text-foreground">DELETE</code> 后点击注销。
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="DELETE"
            className="font-mono md:max-w-xs"
          />
          <Button
            type="button"
            variant="destructive"
            className="font-mono"
            onClick={destroy}
            disabled={busy || confirmInput !== "DELETE"}
          >
            {busy ? "处理中…" : "确认注销"}
          </Button>
        </div>
        <FormError message={error} />
      </div>
    </Section>
  );
}
