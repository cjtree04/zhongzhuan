import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <span className="text-lg font-semibold tracking-tight">中转 Token</span>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild>
            <Link href="/register">注册</Link>
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          一个 API Key,接入全球大模型
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-lg">
          统一调用 OpenAI、Claude、Gemini 等主流模型,按量计费,稳定低延迟。
        </p>
        <div className="mt-10 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/register">免费注册</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/docs">查看文档</Link>
          </Button>
        </div>
      </main>

      <footer className="text-muted-foreground border-t px-6 py-6 text-center text-sm">
        © 2026 中转 Token
      </footer>
    </div>
  );
}
