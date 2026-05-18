# New API 后端能力清单(自研前端的对接契约)

本文件是自研前端 (`src/`) 对接 New API 后端 (`~/Desktop/new-api`) 时的能力清单。
内容来自一次只读审计,不会跟着后端代码自动更新 — 如果后端路由或 DTO 改了,
回来手动同步这份文档。

**重要边界:** `/admin/*` 和所有 admin/root-only 的 `/api/*` 路由继续由 New
API 默认主题提供,自研前端不重写、不镜像。前端只在 NavBar / 控制台首页
对 admin 用户提供一个 hard link 入口跳过去(`target="_top"`)。

------------------------------------------------------------------------

## A. 用户能力 → 现成 New API 接口

### 1. 资料 (Profile)

| 接口 | 说明 |
|---|---|
| `GET /api/user/self` | 当前用户完整资料 + quota + 邀请字段 + `sidebar_modules` |
| `PUT /api/user/self` | 改 `display_name` / `email` / `language` / `sidebar_modules` / `password`(改密码需带 `original_password`) |
| `DELETE /api/user/self` | 软删除自己的账号(root 用户不可删) |
| `GET /api/user/token` | 生成 29~32 字符的个人访问 token |

### 2. 邮箱 / 密码

| 接口 | 说明 |
|---|---|
| `GET /api/verification?email=...&turnstile=...` | 发送邮箱验证码(已被前端 `api.sendEmailVerification` 使用) |
| `POST /api/oauth/email/bind` | `{ email, code }` — 验证码 + 绑定/换邮箱 |
| `PUT /api/user/self` | `{ original_password, password }` — 改密码 |

### 3. 2FA(TOTP + 备份码)

| 接口 | 说明 |
|---|---|
| `GET /api/user/self/2fa/status` | `{ enabled, locked, backup_codes_remaining }` |
| `POST /api/user/self/2fa/setup` | 返回 `secret` / `qr_code_data` / `backup_codes` |
| `POST /api/user/self/2fa/enable` | `{ code }`(TOTP 6 位)启用 |
| `POST /api/user/self/2fa/disable` | `{ code }`(TOTP 或备份码)关闭 |
| `POST /api/user/self/2fa/backup_codes` | `{ code }`(TOTP 验证后)重新生成 10 个备份码 |
| `POST /api/user/login/2fa` | 登录态待 2FA 时提交验证码 — 已被前端 `api.loginVerify2FA` 使用 |

### 4. Passkey (WebAuthn)

| 接口 | 说明 |
|---|---|
| `GET /api/user/self/passkey` | `{ enabled, last_used_at }` |
| `POST /api/user/self/passkey/register/begin` | 拿 WebAuthn `creationOptions`,若 2FA 已开需先做 secure verification |
| `POST /api/user/self/passkey/register/finish` | 提交浏览器 `credential` 完成注册 |
| `DELETE /api/user/self/passkey` | 删除 passkey,需 secure verification |
| `POST /api/user/self/passkey/verify/begin` `.../finish` | 站内敏感操作前做 secure verification 的两步流程 |
| `POST /api/user/passkey/login/begin` `.../finish` | 用 passkey 登录(不需要先登录的两步流程) |

> 自研前端本轮**不实现 passkey login**,登录页继续走用户名密码 + 2FA。
> Passkey **管理(查看 / 注册 / 删除)** 在 `/console/personal` 提供。

### 5. 通知 / 偏好

`PUT /api/user/setting`(对应 `dto.UserSetting`):

| 字段 | 说明 |
|---|---|
| `notify_type` | `email` / `webhook` / `bark` / `gotify` |
| `quota_warning_threshold` | 配额预警阈值(数值 > 0) |
| `webhook_url` `webhook_secret` | `notify_type=webhook` 时使用 |
| `notification_email` | `notify_type=email` 且想指定不同邮箱时 |
| `bark_url` | `notify_type=bark` |
| `gotify_url` `gotify_token` `gotify_priority` | `notify_type=gotify` |
| `accept_unset_model_ratio_model` | 是否允许调用未定价模型 |
| `record_ip_log` | 是否在日志里记录 IP |
| `upstream_model_update_notify_enabled` | **仅 admin/root 可改**,普通用户读不写 |

### 6. 邀请

| 接口 | 说明 |
|---|---|
| `GET /api/user/self/aff` | 返回 4 位邀请码(没有时自动生成);邀请人数 / 累计奖励额度也在 `GET /api/user/self` 里 |
| `POST /api/user/self/aff_transfer` | `{ quota }` — 邀请额度 → 账户余额。受 `requirePaymentCompliance()` 限制,部署没开启则会 4xx,前端按后端 `message` 显示原文 |

### 7. OAuth 绑定

| 接口 | 说明 |
|---|---|
| `GET /api/user/oauth/bindings` | 已绑定的自定义 OAuth provider |
| `DELETE /api/user/oauth/bindings/:provider_id` | 解绑 |
| `GET /api/oauth/wechat/bind?code=...` | 微信绑定回调 |
| `POST /api/oauth/email/bind` | 见上方"邮箱/密码" |

### 8. 签到

| 接口 | 说明 |
|---|---|
| `GET /api/user/checkin?month=YYYY-MM` | 月历状态 |
| `POST /api/user/checkin` | `{ turnstile? }` — 每日签到,带可选 Turnstile token |

### 9. 系统 / 公开只读

| 接口 | 说明 |
|---|---|
| `GET /api/status` | 站点公开配置(quota_per_unit / usd_exchange_rate / display_in_currency / ...) — 已被前端 `api.status` 使用 |
| `GET /api/notice` | 公开公告(html / markdown 字符串) |
| `GET /api/home_page_content` | 首页内容(管理员后台维护,可选用) |
| `GET /api/about` `GET /api/user-agreement` `GET /api/privacy-policy` | 法务文档 |
| `GET /api/pricing` | 公开定价 |
| `GET /api/perf-metrics` `GET /api/perf-metrics/summary` | 性能指标 |
| `GET /api/rankings` | 模型排行(若启用) |

### 10. 用量

| 接口 | 说明 |
|---|---|
| `GET /api/log/self` | 当前用户日志列表(已被前端 `api.logs` 使用,带 type / time / model_name / token_name 过滤) |
| `GET /api/log/self/stat` | 当前用户日志聚合统计(按时间窗口) |
| `GET /api/log/self/search` | 关键字搜索自身日志 |

------------------------------------------------------------------------

## B. 必须保留在 New API 的管理员能力(不重写)

NavBar / 控制台首页仅在 `user.role >= 10`(admin)时透出一个 hard link
`/admin` (`target="_top"`)。以下路由前端**不解析、不渲染、不代理**:

- `/admin/*`
- `/api/option/*`
- `/api/channel/*`
- `/api/user`(admin 列表/CRUD,与上面用户自助接口 `/api/user/self/*` 区分)
- `/api/subscription/admin/*`
- `/api/custom-oauth-provider/*`
- `/api/models/*` `/api/vendors/*`
- `/api/deployments/*`
- `/api/performance/*`
- `/api/ratio_sync/*`
- `/api/redemption/*`
- `/api/log`(全局 — 与 `/api/log/self` 区分)
- `/api/data/*` `/api/prefill_group/*` `/api/group`
- `/api/mj`(全局)、`/api/task`(全局)

------------------------------------------------------------------------

## C. 实施备注

- **认证模型(必读):** 所有请求走同域 `/api/*`,由 nginx 反代到 New API。
  鉴权双轨制:`session` cookie + `New-Api-User: <id>` header。`src/lib/api.ts`
  里的 `jsonFetch` 已经把这两件都处理好,新增方法直接复用。
- **secure verification:** 删 passkey、改邮箱等敏感操作如果后端要求 secure
  verification,要么走 `POST /api/user/self/passkey/verify/{begin,finish}`,
  要么 2FA 验证。本轮 `/console/personal` 只做基础形态,真出现 `403
  require secure verification` 时直接显示后端 message,引导用户先去
  `/admin/...` 或 New API 默认 personal 页操作,不在前端复刻完整 secure
  verification UI。
- **payment compliance:** `aff_transfer` 失败时不要臆测原因,直接显示
  后端 `message`。
- **`sidebar_modules`:** New API 默认主题用它控制侧边栏。自研前端有自己
  的导航,可以读但不写。
