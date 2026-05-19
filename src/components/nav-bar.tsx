"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Check, Copy, Languages, LayoutDashboard, LogOut, Monitor, Moon, ShieldCheck, Sun, UserCircle, Wallet } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/use-auth"
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
  const { user, loading, logout } = useAuth()

  const { theme, setTheme, resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => setThemeMounted(true), [])

  // Trigger icon mirrors what the user actually sees right now.
  // Before mount, render Sun as a neutral placeholder to avoid hydration jitter.
  const TriggerIcon = !themeMounted ? Sun : resolvedTheme === "dark" ? Moon : Sun

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
      description: "功能开发中，稍后上线。",
    })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <nav className="flex items-center gap-8">
          <Link
            href="/"
            onClick={handleLeftClick("scrollTop", "/")}
            className="font-mono text-[15px] font-semibold tracking-tight text-brand select-none transition-transform duration-200 hover:-translate-y-px"
          >
            Zhongzhuan&nbsp;Token
          </Link>
          <ul className="hidden items-center gap-7 md:flex">
            {LEFT_LINKS.map((link) => {
              const active = onHome && link.href === "/"
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={handleLeftClick(link.action, link.href)}
                    className={cn(
                      "group relative inline-flex items-center font-mono text-[13px] uppercase tracking-wider text-muted-foreground transition-all duration-200",
                      "hover:-translate-y-px hover:text-brand",
                      active && "text-foreground",
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-1.5 left-0 right-0 h-px origin-left scale-x-0 bg-brand transition-transform duration-200",
                        "group-hover:scale-x-100",
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              )
            })}
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="切换语言"
                  className="text-muted-foreground"
                >
                  <Languages />
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={6} className="font-mono">
              <DropdownMenuItem onClick={comingSoon("中文")}>中文</DropdownMenuItem>
              <DropdownMenuItem onClick={comingSoon("English")}>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="切换主题"
                  className="text-muted-foreground"
                  suppressHydrationWarning
                >
                  <TriggerIcon suppressHydrationWarning />
                </Button>
              }
            />
            <DropdownMenuContent align="end" sideOffset={6} className="font-mono">
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 size-3.5" />
                跟随系统
                {themeMounted && theme === "system" && <CheckMark />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 size-3.5" />
                浅色
                {themeMounted && theme === "light" && <CheckMark />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 size-3.5" />
                深色
                {themeMounted && theme === "dark" && <CheckMark />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mx-1 h-5 w-px bg-border" />
          {/* 登录态切换:loading 时啥都不显示(避免闪);已登录显示控制台 + 用户菜单;未登录显示登录/注册 */}
          {loading ? (
            <div className="w-[120px]" aria-hidden />
          ) : user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                className="font-mono"
                render={
                  <Link href="/console" target="_top">
                    <LayoutDashboard />
                    控制台
                  </Link>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`已登录:${user.display_name || user.username}`}
                      className="text-foreground"
                    >
                      <UserCircle />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" sideOffset={6} className="font-mono min-w-44">
                  <div className="border-b border-border px-2 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      已登录
                    </div>
                    <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {user.display_name || user.username}
                    </div>
                  </div>
                  <DropdownMenuItem
                    render={
                      <Link href="/console" target="_top">
                        <LayoutDashboard className="mr-2 size-3.5" />
                        控制台
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/console/topup" target="_top">
                        <Wallet className="mr-2 size-3.5" />
                        充值
                      </Link>
                    }
                  />
                  <DropdownMenuItem
                    render={
                      <Link href="/console/personal">
                        <UserCircle className="mr-2 size-3.5" />
                        个人设置
                      </Link>
                    }
                  />
                  {user.role >= 10 ? (
                    <DropdownMenuItem
                      render={
                        <Link href="/admin" target="_top">
                          <ShieldCheck className="mr-2 size-3.5" />
                          管理员后台
                        </Link>
                      }
                    />
                  ) : null}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 size-3.5" />
                    退出登录
                  </DropdownMenuItem>

                  {/* 客服微信 + $20 提示 */}
                  <div className="mt-1 border-t border-border bg-brand/5 px-3 py-2.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-brand">
                      新用户福利
                    </div>
                    <div className="mt-1 font-mono text-[11px] leading-relaxed text-foreground">
                      加客服微信领{" "}
                      <span className="font-semibold text-brand">$20 额度</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        navigator.clipboard.writeText("Mou_zaisi").then(() => {
                          toast.success("微信号已复制:Mou_zaisi")
                        })
                      }}
                      className="mt-1.5 flex w-full items-center justify-between gap-2 border border-border bg-background px-2 py-1 font-mono text-[11px] hover:border-brand/50"
                    >
                      <span>
                        微信: <span className="font-semibold text-foreground">Mou_zaisi</span>
                      </span>
                      <Copy className="size-3 text-muted-foreground" />
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                className="font-mono"
                render={<Link href="/login">登录</Link>}
              />
              <Button
                size="sm"
                nativeButton={false}
                className="font-mono"
                render={<Link href="/register">注册</Link>}
              />
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function CheckMark() {
  return <Check className="ml-auto size-3.5 text-brand" />
}
