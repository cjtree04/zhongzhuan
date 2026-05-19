import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 — Zhongzhuan Token",
  description: "登录到 Zhongzhuan Token。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
