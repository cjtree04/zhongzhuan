import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "个人设置 — Zhongzhuan Token",
  description: "修改昵称、邮箱换绑、安全设置、通知偏好、邀请奖励。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
