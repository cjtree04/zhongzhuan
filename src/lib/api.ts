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

  /** 找回密码 step 1:输邮箱触发,服务端发重置邮件(若邮箱已注册) */
  sendPasswordResetEmail(email: string) {
    return jsonFetch<null>(
      `/api/reset_password?email=${encodeURIComponent(email)}`,
      { method: "GET" },
    );
  },

  /** 找回密码 step 2:校验 email+token,服务端生成新密码返回 */
  resetPassword(email: string, token: string) {
    return jsonFetch<string>("/api/user/reset", {
      method: "POST",
      body: JSON.stringify({ email, token }),
    });
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

  /** 按关键词搜索 token */
  tokenSearch(keyword: string) {
    return jsonFetch<Paginated<TokenRow>>(
      `/api/token/search?keyword=${encodeURIComponent(keyword)}`,
      { method: "GET" },
    );
  },

  /** 获取完整 key(敏感,有 rate limit) */
  tokenGetKey(id: number) {
    return jsonFetch<{ key: string }>(`/api/token/${id}/key`, {
      method: "POST",
    });
  },

  /** 创建 token */
  tokenCreate(payload: TokenCreatePayload) {
    return jsonFetch<null>("/api/token/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** 更新 token(包括 rename / 改额度 / 改过期等) */
  tokenUpdate(payload: TokenUpdatePayload) {
    return jsonFetch<null>("/api/token/", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /** 仅切换 status(启用/禁用,后端识别 status_only 查询参数) */
  tokenToggleStatus(id: number, status: number) {
    return jsonFetch<null>("/api/token/?status_only=true", {
      method: "PUT",
      body: JSON.stringify({ id, status }),
    });
  },

  /** 删除 token */
  tokenDelete(id: number) {
    return jsonFetch<null>(`/api/token/${id}`, { method: "DELETE" });
  },

  /** 当前用户的调用日志(分页 + 过滤) */
  logs(params: LogQuery) {
    const qs = new URLSearchParams();
    qs.set("p", String(params.page ?? 0));
    qs.set("page_size", String(params.pageSize ?? 20));
    if (params.type !== undefined && params.type !== 0)
      qs.set("type", String(params.type));
    if (params.startTimestamp)
      qs.set("start_timestamp", String(params.startTimestamp));
    if (params.endTimestamp)
      qs.set("end_timestamp", String(params.endTimestamp));
    if (params.modelName) qs.set("model_name", params.modelName);
    if (params.tokenName) qs.set("token_name", params.tokenName);
    return jsonFetch<Paginated<LogRow>>(`/api/log/self?${qs}`, {
      method: "GET",
    });
  },

  /** 充值配置(支付方式、最小充值、金额选项、折扣等) */
  topupInfo() {
    return jsonFetch<TopUpInfo>("/api/user/topup/info", { method: "GET" });
  },

  /**
   * 用户充值记录。
   * New API 没有独立的 topup history endpoint —— 充值历史是 logs 表里 type=1 的条目。
   * 这里走通用 /api/log/self?type=1,把 LogRow 抽出来给前端展示。
   */
  topupHistory(pageSize = 20) {
    return jsonFetch<Paginated<LogRow>>(
      `/api/log/self?p=0&page_size=${pageSize}&type=1`,
      { method: "GET" },
    );
  },

  /** 兑换码兑换 */
  topupRedeem(key: string) {
    return jsonFetch<number>("/api/user/topup", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  },

  /** 在线充值预览(算实付金额) */
  topupAmount(amount: number) {
    return jsonFetch<{ pay_money: number }>("/api/user/amount", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },

  /**
   * 拉起易支付。注意:这个接口返回 shape 是 {message: "success"|"error", data, url},
   * 不是标准 {success, data}。要单独处理。
   */
  async topupRequestEpay(amount: number, payment_method: string) {
    try {
      const res = await fetch("/api/user/pay", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(getStoredUserId()
            ? { "New-Api-User": getStoredUserId() as string }
            : {}),
        },
        body: JSON.stringify({ amount, payment_method }),
      });
      const data = (await res.json()) as {
        message: string;
        data: Record<string, string> | string;
        url?: string;
      };
      return data;
    } catch {
      return { message: "error", data: "网络错误" };
    }
  },

  /** 更新当前用户资料(可选传 display_name / email / language / sidebar_modules;改密码必须带 original_password) */
  updateSelf(payload: UpdateSelfPayload) {
    return jsonFetch<null>("/api/user/self", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /** 软删除当前账号(不可逆,前端必须做二次确认) */
  deleteSelf() {
    return jsonFetch<null>("/api/user/self", { method: "DELETE" });
  },

  /** 邮箱换绑/首绑:需要先 sendEmailVerification,再带 code */
  bindEmail(payload: { email: string; code: string }) {
    return jsonFetch<null>("/api/oauth/email/bind", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** 通知与偏好(UserSetting JSON);PUT /api/user/setting,可只传需要更新的字段 */
  updateSetting(payload: UserSettingPayload) {
    return jsonFetch<null>("/api/user/setting", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // ── 2FA ──────────────────────────────────────────────────
  twoFAStatus() {
    return jsonFetch<TwoFAStatus>("/api/user/self/2fa/status", { method: "GET" });
  },
  twoFASetup() {
    return jsonFetch<TwoFASetup>("/api/user/self/2fa/setup", { method: "POST" });
  },
  twoFAEnable(code: string) {
    return jsonFetch<null>("/api/user/self/2fa/enable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
  twoFADisable(code: string) {
    return jsonFetch<null>("/api/user/self/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
  twoFARegenerateBackupCodes(code: string) {
    return jsonFetch<{ backup_codes: string[] }>(
      "/api/user/self/2fa/backup_codes",
      { method: "POST", body: JSON.stringify({ code }) },
    );
  },

  // ── Passkey ──────────────────────────────────────────────
  passkeyStatus() {
    return jsonFetch<PasskeyStatus>("/api/user/self/passkey", { method: "GET" });
  },

  // ── 邀请 ─────────────────────────────────────────────────
  affCode() {
    return jsonFetch<{ aff_code: string }>("/api/user/self/aff", { method: "GET" });
  },
  affTransfer(quota: number) {
    return jsonFetch<null>("/api/user/self/aff_transfer", {
      method: "POST",
      body: JSON.stringify({ quota }),
    });
  },
};

export type PayMethod = {
  name: string;
  type: string;
  color?: string;
  min_topup?: string;
};

export type UpdateSelfPayload = {
  display_name?: string;
  email?: string;
  language?: string;
  sidebar_modules?: string;
  original_password?: string;
  password?: string;
};

/** New API dto.UserSetting 的子集,前端用到哪个就传哪个 */
export type UserSettingPayload = Partial<{
  notify_type: "email" | "webhook" | "bark" | "gotify";
  quota_warning_threshold: number;
  webhook_url: string;
  webhook_secret: string;
  notification_email: string;
  bark_url: string;
  gotify_url: string;
  gotify_token: string;
  gotify_priority: number;
  accept_unset_model_ratio_model: boolean;
  record_ip_log: boolean;
}>;

export type TwoFAStatus = {
  enabled: boolean;
  locked?: boolean;
  backup_codes_remaining?: number;
};

export type TwoFASetup = {
  secret: string;
  qr_code_data: string;
  backup_codes: string[];
};

export type PasskeyStatus = {
  enabled: boolean;
  last_used_at?: number;
};

export type TopUpInfo = {
  pay_methods: PayMethod[];
  min_topup: number;
  amount_options?: number[];
  discount?: Record<string, number>;
  topup_link?: string;
  stripe_min_topup?: number;
};

export type TopUpRecord = {
  id: number;
  user_id: number;
  amount: number;
  money: number;
  trade_no: string;
  payment_method: string;
  payment_provider?: string;
  create_time: number;
  complete_time?: number;
  status: string; // "pending" | "success" | "failed" | "cancelled"
};

export type SiteStatus = {
  version?: string;
  quota_per_unit?: number;
  usd_exchange_rate?: number;
  display_in_currency?: boolean;
  quota_display_type?: "USD" | "CNY" | "TOKENS" | "CUSTOM";
  system_name?: string;
};

export type TokenCreatePayload = {
  name: string;
  unlimited_quota: boolean;
  remain_quota: number;
  expired_time: number; // -1 = never, else unix seconds
  model_limits_enabled?: boolean;
  model_limits?: string;
  allow_ips?: string;
  group?: string;
};

export type TokenUpdatePayload = {
  id: number;
  name?: string;
  unlimited_quota?: boolean;
  remain_quota?: number;
  expired_time?: number;
  status?: number;
  model_limits_enabled?: boolean;
  model_limits?: string;
  allow_ips?: string;
  group?: string;
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

export type LogQuery = {
  page?: number;
  pageSize?: number;
  type?: number; // 0=all/unknown, 1=topup, 2=consume, 3=manage, 4=system, 5=error, 6=refund
  startTimestamp?: number; // unix seconds
  endTimestamp?: number;
  modelName?: string;
  tokenName?: string;
};

export type LogRow = {
  id: number;
  user_id: number;
  created_at: number;
  type: number;
  content: string;
  username: string;
  token_name: string;
  model_name: string;
  quota: number;
  prompt_tokens: number;
  completion_tokens: number;
  use_time: number;
  is_stream: boolean;
  channel: number;
  channel_name?: string;
  token_id: number;
  group: string;
  ip: string;
  request_id?: string;
  upstream_request_id?: string;
  other: string;
};
