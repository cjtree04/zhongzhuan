import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "控制台 — Zhongzhuan Token",
  description: "Zhongzhuan Token 用户控制台 — 余额、消耗、用量看板。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
