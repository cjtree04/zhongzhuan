"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { AuthCard, FormError } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, clearAuthState, getStoredUserId, saveAuthState } from "@/lib/api";

/**
 * 把外部传入的 redirect 参数夹到「站内相对路径」内,避免开放重定向。
 * 规则:必须以 `/` 开头,且不能是 `//foo`、`/\foo` 这种协议相对的形式。
 * 不合法时直接落回 `/console`。
 */
function safeRedirect(raw: string | null): string {
  const fallback = "/console";
  if (!raw) return fallback;
  if (raw.length > 512) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

function LoginInner() {
  const params = useSearchParams();
  const redirectTo = useMemo(
    () => safeRedirect(params.get("redirect")),
    [params],
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [needs2FA, setNeeds2FA] = useState(false);
  const [code, setCode] = useState("");

  // 已登录就直接跳走;但要先校验 localStorage 和服务端身份一致(防脏状态死循环)
  useEffect(() => {
    api.self().then((r) => {
      if (!r.success || !r.data?.id) return; // 未登录,留在 /login
      const stored = getStoredUserId();
      if (stored && stored !== String(r.data.id)) {
        // session 和 localStorage 用户不一致 → 清掉 localStorage,留在 /login 重新登录
        clearAuthState();
        return;
      }
      if (!stored) {
        // 服务端认得我们但本地没存 uid → 补写,避免 /console SPA 不识别
        saveAuthState(r.data);
      }
      window.location.replace(redirectTo);
    });
  }, [redirectTo]);

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await api.login({ username, password });
    setLoading(false);
    if (!r.success) {
      setError(r.message || "登录失败");
      return;
    }
    if (r.data?.require_2fa) {
      setNeeds2FA(true);
      return;
    }
    // 写 localStorage 让 /console 的 New API SPA 也能识别已登录
    if (r.data) saveAuthState(r.data);
    // hard reload 让 New API 的 /console SPA 重新初始化 localStorage
    window.location.replace(redirectTo);
  }

  async function submit2FA(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const r = await api.loginVerify2FA({ code });
    setLoading(false);
    if (!r.success) {
      setError(r.message || "验证码错误");
      return;
    }
    if (r.data) saveAuthState(r.data);
    window.location.replace(redirectTo);
  }

  if (needs2FA) {
    return (
      <AuthCard
        eyebrow="TWO-FACTOR · 二次验证"
        title="输入验证码"
        subtitle="打开 Authenticator,输入 6 位动态码完成登录。"
      >
        <form onSubmit={submit2FA} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="font-mono text-[11px] uppercase tracking-wider">
              6 位验证码
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono text-2xl tracking-[0.4em]"
              disabled={loading}
            />
          </div>
          <FormError message={error} />
          <Button
            type="submit"
            size="lg"
            className="w-full font-mono"
            disabled={loading || code.length !== 6}
          >
            {loading ? "验证中…" : "验证并登录"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setNeeds2FA(false);
              setCode("");
              setError("");
            }}
            className="block w-full text-center font-mono text-xs text-muted-foreground hover:text-brand"
          >
            ← 返回上一步
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="LOGIN · 登录"
      title="登录到 Zhongzhuan Token"
      subtitle="用户名或邮箱 + 密码,登录后进入控制台。"
    >
      <form onSubmit={submitLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username" className="font-mono text-[11px] uppercase tracking-wider">
            用户名 / 邮箱
          </Label>
          <Input
            id="username"
            type="text"
            required
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="cj / cj@example.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider">
              密码
            </Label>
            <button
              type="button"
              onClick={() =>
                toast("忘记密码 · 暂未开放", {
                  description: "请通过站内客服或邮箱联系管理员重置密码。",
                })
              }
              className="font-mono text-[11px] text-muted-foreground hover:text-brand"
            >
              忘记密码?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="••••••••"
          />
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full font-mono"
          disabled={loading || !username || !password}
        >
          {loading ? "登录中…" : "登录"}
        </Button>

        <div className="text-center font-mono text-xs text-muted-foreground">
          还没有账号?{" "}
          <Link href="/register" className="text-brand underline-offset-2 hover:underline">
            注册一个 →
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
