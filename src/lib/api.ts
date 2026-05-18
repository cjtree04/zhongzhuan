/**
 * New API client helpers.
 *
 * 所有请求走同域 /api/*(nginx 反代到 New API Docker :3000)。
 *
 * 认证模型(New API 用双轨制,缺一不可):
 *   1) `session` cookie    — 服务端 Gin sessions 颁发,credentials: "include" 自动带
 *   2) `New-Api-User: <id>` header — 客户端必须显式塞,服务端从这里取 user_id
 *
 * 第 2 步是关键:仅有 cookie 时 protected 接口直接 401,
 * 错误信息会是 "Unauthorized, New-Api-User header not provided"。
 *
 * 我们在 login/2fa 成功后把 user 信息写到 localStorage,key 同时写两份
 * 兼容 New API 两套主题:
 *   - `uid`  = 用户 id 字符串  (default theme 读)
 *   - `user` = 整个 user 对象 JSON  (classic theme 读)
 * 这样跳到 /console 时 New API 的 SPA 也能识别。
 */

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

export type SelfUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: number;
  status: number;
  group: string;
  quota: number;
  used_quota: number;
  request_count: number;
  aff_code: string;
  aff_count: number;
  aff_quota: number;
  aff_history_quota: number;
  inviter_id?: number;
};

export type LoginResult = {
  id?: number;
  username?: string;
  display_name?: string;
  role?: number;
  status?: number;
  group?: string;
  require_2fa?: boolean;
};

/** 从 localStorage 取已登录用户的 id(default 主题 `uid` 优先;回退到 classic `user.id`) */
export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const uid = window.localStorage.getItem("uid");
    if (uid) return uid;
    const userJson = window.localStorage.getItem("user");
    if (userJson) {
      const u = JSON.parse(userJson);
      if (u?.id != null) return String(u.id);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 登录/2FA 成功后调用,把用户信息同时写两个 key,兼容 New API 两套主题 */
export function saveAuthState(user: {
  id?: number;
  username?: string;
  display_name?: string;
  role?: number;
  status?: number;
  group?: string;
}) {
  if (typeof window === "undefined") return;
  if (user?.id != null) {
    window.localStorage.setItem("uid", String(user.id));
    window.localStorage.setItem("user", JSON.stringify(user));
  }
}

/** 退出登录后清掉认证状态(session cookie 服务端会清) */
export function clearAuthState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("uid");
  window.localStorage.removeItem("user");
}

async function jsonFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    };
    // 自动带 New-Api-User header(已登录情况下)
    const uid = getStoredUserId();
    if (uid) headers["New-Api-User"] = uid;

    const res = await fetch(path, {
      credentials: "include",
      ...init,
      headers,
    });
    // 401/403 等也会有 JSON body
    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch {
    return { success: false, message: "网络错误,请稍后重试" };
  }
}

export const api = {
  login(payload: { username: string; password: string }) {
    return jsonFetch<LoginResult>("/api/user/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  loginVerify2FA(payload: { code: string }) {
    return jsonFetch<LoginResult>("/api/user/login/2fa", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  register(payload: {
    username: string;
    password: string;
    email?: string;
    verification_code?: string;
    aff_code?: string;
  }) {
    return jsonFetch<null>("/api/user/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  logout() {
    return jsonFetch<null>("/api/user/logout", { method: "GET" });
  },

  self() {
    return jsonFetch<SelfUser>("/api/user/self", { method: "GET" });
  },

  sendEmailVerification(email: string) {
    return jsonFetch<null>(
      `/api/verification?email=${encodeURIComponent(email)}`,
      { method: "GET" },
    );
  },

  /** 站点公开配置(quota_per_unit / usd_exchange_rate / ...) */
  status() {
    return jsonFetch<SiteStatus>("/api/status", { method: "GET" });
  },

  /** 当前用户的 API token 列表(分页) */
  tokens(page = 0, pageSize = 20) {
    return jsonFetch<Paginated<TokenRow>>(
      `/api/token/?p=${page}&page_size=${pageSize}`,
      { method: "GET" },
    );
  },
};

export type SiteStatus = {
  version?: string;
  quota_per_unit?: number;
  usd_exchange_rate?: number;
  display_in_currency?: boolean;
  quota_display_type?: "USD" | "CNY" | "TOKENS" | "CUSTOM";
  system_name?: string;
};

export type TokenRow = {
  id: number;
  user_id: number;
  key: string; // masked
  status: number; // 1 = enabled
  name: string;
  created_time: number;
  accessed_time: number;
  expired_time: number; // -1 = never
  remain_quota: number;
  unlimited_quota: boolean;
  used_quota: number;
  group: string;
};

export type Paginated<T> = {
  items: T[];
  page?: number;
  page_size?: number;
  total?: number;
};
