import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "充值 — Zhongzhuan Token",
  description: "充值美元额度,¥0.42 = $1,最低 $10 起,支持支付宝/微信。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
