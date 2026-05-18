/**
 * New API client helpers.
 *
 * 所有请求走同域 /api/*(nginx 反代到 New API Docker :3000),
 * `credentials: "include"` 保证 session cookie 自动带上。
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

async function jsonFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
    // Some endpoints return 401/403 with JSON body; still parse
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
};
