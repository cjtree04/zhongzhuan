"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthCard, FormError, FormSuccess } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialAffCode = params.get("aff") || "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [affCode, setAffCode] = useState(initialAffCode);

  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 已登录就直接跳走
  useEffect(() => {
    api.self().then((r) => {
      if (r.success && r.data?.id) router.replace("/console");
    });
  }, [router]);

  async function sendCode() {
    if (!email) {
      setError("请先填写邮箱");
      return;
    }
    setError("");
    setSuccess("");
    setSendingCode(true);
    const r = await api.sendEmailVerification(email);
    setSendingCode(false);
    if (!r.success) {
      setError(r.message || "邮件发送失败");
      return;
    }
    setSuccess("验证码已发送,请查收邮箱(含垃圾邮件)");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }

    setLoading(true);
    const r = await api.register({
      username,
      password,
      email: email || undefined,
      verification_code: verificationCode || undefined,
      aff_code: affCode || undefined,
    });
    setLoading(false);

    if (!r.success) {
      setError(r.message || "注册失败");
      return;
    }

    setSuccess("注册成功!2 秒后跳转登录页…");
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <AuthCard
      eyebrow="REGISTER · 注册"
      title="创建你的账号"
      subtitle="注册后送测试额度,无需绑卡。注册即视为同意服务条款。"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="r_username" className="font-mono text-[11px] uppercase tracking-wider">
            用户名
          </Label>
          <Input
            id="r_username"
            type="text"
            required
            minLength={4}
            maxLength={12}
            pattern="^[a-zA-Z0-9_-]{4,12}$"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="4-12 位,字母数字下划线"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r_password" className="font-mono text-[11px] uppercase tracking-wider">
            密码
          </Label>
          <Input
            id="r_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="至少 8 位"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r_confirm" className="font-mono text-[11px] uppercase tracking-wider">
            确认密码
          </Label>
          <Input
            id="r_confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="font-mono"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="r_email" className="font-mono text-[11px] uppercase tracking-wider">
            邮箱 <span className="text-muted-foreground/70">(若后台开启邮箱验证则必填)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="r_email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-mono flex-1"
              disabled={loading}
              placeholder="you@example.com"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
              nativeButton
              onClick={sendCode}
              disabled={loading || sendingCode || !email}
              className="font-mono whitespace-nowrap"
            >
              {sendingCode ? "发送中…" : "发送验证码"}
            </Button>
          </div>
        </div>

        {email ? (
          <div className="space-y-2">
            <Label htmlFor="r_code" className="font-mono text-[11px] uppercase tracking-wider">
              邮箱验证码 <span className="text-muted-foreground/70">(可选,若已发送)</span>
            </Label>
            <Input
              id="r_code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              className="font-mono"
              disabled={loading}
              placeholder="6 位数字"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="r_aff" className="font-mono text-[11px] uppercase tracking-wider">
            邀请码 <span className="text-muted-foreground/70">(选填)</span>
          </Label>
          <Input
            id="r_aff"
            type="text"
            value={affCode}
            onChange={(e) => setAffCode(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="有邀请人填写,双方获奖励"
          />
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        <Button
          type="submit"
          size="lg"
          className="w-full font-mono"
          disabled={loading || !username || !password || !confirm}
        >
          {loading ? "注册中…" : "注册"}
        </Button>

        <div className="text-center font-mono text-xs text-muted-foreground">
          已有账号?{" "}
          <Link href="/login" className="text-brand underline-offset-2 hover:underline">
            登录 →
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
