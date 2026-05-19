"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";

import { AuthCard, FormError, FormSuccess } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("请填写邮箱");
      return;
    }
    setLoading(true);
    const r = await api.sendPasswordResetEmail(email.trim());
    setLoading(false);
    if (!r.success) {
      setError(r.message || "发送失败，请稍后重试");
      return;
    }
    // 服务端不会暴露邮箱是否注册(防探测),无论结果都显示已发送
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        eyebrow="EMAIL SENT · 邮件已发送"
        title="请查收邮箱"
        subtitle={`如果 ${email} 已注册，你会在几分钟内收到重置邮件。`}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 border border-brand/30 bg-brand/5 p-4">
            <MailCheck className="size-5 shrink-0 text-brand" />
            <div className="space-y-1 font-mono text-xs leading-relaxed text-foreground">
              <div>邮件包含一个一次性重置链接,30 分钟内有效。</div>
              <div className="text-muted-foreground">
                没收到?检查垃圾邮件，或确认邮箱拼写无误。
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full font-mono"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            换个邮箱再发一次
          </Button>

          <Link
            href="/login"
            className="block text-center font-mono text-xs text-muted-foreground hover:text-brand"
          >
            <ArrowLeft className="mr-1 inline size-3" />
            返回登录
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="FORGOT · 找回密码"
      title="重置你的密码"
      subtitle="输入注册邮箱，我们会发一封带重置链接的邮件给你。"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="forgot_email"
            className="font-mono text-[11px] uppercase tracking-wider"
          >
            注册邮箱
          </Label>
          <Input
            id="forgot_email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-mono"
            disabled={loading}
            placeholder="you@example.com"
          />
        </div>

        <FormError message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full font-mono"
          disabled={loading || !email.trim()}
        >
          {loading ? "发送中…" : "发送重置邮件"}
        </Button>

        <div className="space-y-2 text-center font-mono text-xs text-muted-foreground">
          <div>
            想起来了?{" "}
            <Link
              href="/login"
              className="text-brand underline-offset-2 hover:underline"
            >
              直接登录 →
            </Link>
          </div>
          <div>
            还没账号?{" "}
            <Link
              href="/register"
              className="text-brand underline-offset-2 hover:underline"
            >
              注册一个 →
            </Link>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}
