"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AuthCard, FormError } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

function ResetInner() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!email || !token) {
      setError("链接缺少必要参数 — 请重新发送重置邮件");
      setLoading(false);
      return;
    }
    api.resetPassword(email, token).then((r) => {
      setLoading(false);
      if (!r.success) {
        setError(r.message || "重置链接非法或已过期");
        return;
      }
      const pwd = r.data;
      if (typeof pwd === "string" && pwd) {
        setNewPassword(pwd);
      } else {
        setError("服务端未返回新密码,请联系客服");
      }
    });
  }, [email, token]);

  async function copy() {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <AuthCard
        eyebrow="VERIFYING · 验证中"
        title="正在重置密码"
        subtitle="校验链接有效性,这一步不会让你输任何东西。"
      >
        <div className="flex items-center justify-center py-8 font-mono text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          loading…
        </div>
      </AuthCard>
    );
  }

  if (error) {
    return (
      <AuthCard
        eyebrow="FAILED · 重置失败"
        title="链接已失效"
        subtitle="出于安全考虑,重置链接 30 分钟过期,且只能使用一次。"
      >
        <div className="space-y-5">
          <FormError message={error} />
          <Button
            className="w-full font-mono"
            nativeButton={false}
            render={<Link href="/forgot">重新发送重置邮件</Link>}
          />
          <Link
            href="/login"
            className="block text-center font-mono text-xs text-muted-foreground hover:text-brand"
          >
            返回登录
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="RESET · 新密码已生成"
      title="妥善保管这个密码"
      subtitle="出于安全考虑,我们生成了一个一次性密码。立刻复制并去登录,然后在「个人设置」里改成你记得住的。"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="font-mono text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <strong>关闭此页后将无法再次看到。</strong>
            如不慎丢失,需重新走找回流程。
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            邮箱
          </div>
          <div className="break-all border border-border bg-secondary/40 px-3 py-2 font-mono text-sm">
            {email}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            新密码
          </div>
          <div className="break-all border border-border bg-secondary/50 px-4 py-3 font-mono text-base text-foreground">
            {newPassword}
          </div>
        </div>

        <Button onClick={copy} size="lg" className="w-full font-mono">
          {copied ? <Check /> : <Copy />}
          {copied ? "已复制" : "复制密码"}
        </Button>

        <Button
          variant="outline"
          className="w-full font-mono"
          nativeButton={false}
          render={
            <Link href="/login">
              <KeyRound />
              去登录
            </Link>
          }
        />
      </div>
    </AuthCard>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
