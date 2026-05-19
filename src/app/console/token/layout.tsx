import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Token — Zhongzhuan Token",
  description: "创建和管理 Zhongzhuan Token 的 API Key,设置额度与过期时间。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
