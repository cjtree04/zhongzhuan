"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Languages, Moon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LEFT_LINKS = [
  { label: "首页", href: "/", action: "scrollTop" as const },
  { label: "价格", href: "/pricing", action: "navigate" as const },
  { label: "文档", href: "/docs", action: "navigate" as const },
  { label: "常见问题", href: "/#faq", action: "scrollToFaq" as const },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const onHome = pathname === "/"

  const handleLeftClick =
    (action: "scrollTop" | "navigate" | "scrollToFaq", href: string) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (action === "scrollTop") {
        if (onHome) {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
        return
      }
      if (action === "scrollToFaq") {
        e.preventDefault()
        if (onHome) {
          document
            .getElementById("faq")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        } else {
          router.push("/#faq")
        }
        return
      }
    }

  const comingSoon = (label: string) => () =>
    toast(`${label} · Coming soon`, {
      description: "功能开发中,稍后上线。",
    })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <nav className="flex items-center gap-8">
          <Link
            href="/"
            onClick={handleLeftClick("scrollTop", "/")}
            className="font-mono text-[15px] font-semibold tracking-tight text-brand select-none"
          >
            Zhongzhuan&nbsp;Token
          </Link>
          <ul className="hidden items-center gap-6 md:flex">
            {LEFT_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={handleLeftClick(link.action, link.href)}
                  className={cn(
                    "font-mono text-[13px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
                    onHome && link.href === "/" && "text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="系统公告"
            onClick={comingSoon("系统公告")}
            className="text-muted-foreground"
          >
            <Bell />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="切换语言"
            onClick={comingSoon("语言切换")}
            className="font-mono text-muted-foreground"
          >
            <Languages />
            <span className="hidden lg:inline">中 / EN</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="切换主题"
            onClick={comingSoon("主题切换")}
            className="text-muted-foreground"
          >
            <Moon />
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={comingSoon("登录")}
            className="font-mono"
          >
            登录
          </Button>
          <Button
            size="sm"
            onClick={comingSoon("注册")}
            className="font-mono"
          >
            注册
          </Button>
        </div>
      </div>
    </header>
  )
}
