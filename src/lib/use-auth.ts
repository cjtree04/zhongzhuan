"use client";

import { useEffect, useState } from "react";

import { api, clearAuthState, type SelfUser } from "@/lib/api";

type AuthState = {
  user: SelfUser | null;
  loading: boolean;
  /** 退出登录:调服务端清 session、清本地 localStorage、跳首页 */
  logout: () => Promise<void>;
};

/**
 * 客户端 hook,挂载时通过 /api/user/self 拉用户信息。
 * 注意:NavBar 在 layout.tsx 里，每次路由都会重新挂载 → 每次会发一次 self()。
 * 实际场景下浏览器会自动缓存(Cache-Control 我们的 api 没禁用),不会真打到 origin。
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<SelfUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.self().then((r) => {
      if (cancelled) return;
      if (r.success && r.data?.id) {
        setUser(r.data);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await api.logout().catch(() => undefined);
    clearAuthState();
    setUser(null);
    window.location.replace("/");
  }

  return { user, loading, logout };
}
