import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "找回密码 — Zhongzhuan Token",
  description: "通过注册邮箱重置 Zhongzhuan Token 登录密码。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
