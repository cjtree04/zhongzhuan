import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "消耗日志 — Zhongzhuan Token",
  description: "查看每一次 API 调用的明细:模型、tokens、费用、用时。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
