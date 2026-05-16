"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
        中转 Token
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">登录</CardTitle>
          <CardDescription>使用邮箱密码登录账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="mt-2 w-full">
              登录
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-sm">
        还没有账号?{" "}
        <Link
          href="/register"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
