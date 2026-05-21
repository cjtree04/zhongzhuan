/**
 * Model pricing data + billing math.
 *
 * 真实算法(对照站点后台 New API 设置):
 * ──────────────────────────────────────────────────────────────
 * · 充值比例: ¥0.42 → $1 余额(固定，与人民币汇率脱钩)
 * · 消耗倍率(group_ratio,前端展示用,后端已手动 ×对应倍率):
 *     - GPT(全系): 2× → 用 $1 显示价时，扣 $2 余额 = ¥0.84
 *     - Gemini(全系): 2× → 用 $1 显示价时，扣 $2 余额 = ¥0.84
 *     - Claude(全系): 3× → 用 $1 显示价时，扣 $3 余额 = ¥1.26
 * · 我家"实际人民币成本" = official_usd × ratio × TOPUP_RATE
 * · 对比官方"真实人民币成本" = official_usd × USD_TO_CNY (按真实汇率 ≈ 7)
 * · 节省比例 = 1 − ratio × TOPUP_RATE / USD_TO_CNY
 *     - GPT/Gemini: 1 − 2×0.42/7 ≈ 88%
 *     - Claude:     1 − 3×0.42/7 ≈ 82%
 *
 * 想调整:
 * · 充值比例 → TOPUP_RATE
 * · 真实汇率 → USD_TO_CNY
 * · 某家倍率 → GROUP_RATIO
 * · 单个模型价 → 改 LineItem.price
 *
 * 数据源:对标 thinkai.tv/pricing(2026-05-21 抓取),15 个模型同步,与本站后端一致。
 */

export const TOPUP_RATE = 0.42; // ¥ per $ of balance
export const USD_TO_CNY = 7; // official market rate, used only for savings comparison

export type Provider = "claude" | "gpt" | "gemini";

export const GROUP_RATIO: Record<Provider, number> = {
  claude: 3,
  gpt: 2,
  gemini: 2,
};

export type Price = {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
};

export type ModelRow = {
  model: string;
  display: string;
  provider: Provider;
  /** Official USD prices per 1M tokens (synced with thinkai.tv/pricing). */
  price: Price;
  /** Optional badge text (e.g. "旗舰", "Codex", "性价比"). */
  badge?: string;
};

export type ProviderTab = {
  id: Provider;
  name: string;
  tabLabel: string;
  description: string;
  full: ModelRow[];
};

// ────────────────────────────────────────────────────────────────
// Anthropic — 6 个(与 thinkai.tv/pricing 同步)
// ────────────────────────────────────────────────────────────────

const CLAUDE: ModelRow[] = [
  { model: "claude-opus-4-7", display: "claude-opus-4-7", provider: "claude",
    price: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 }, badge: "旗舰" },
  { model: "claude-opus-4-6", display: "claude-opus-4-6", provider: "claude",
    price: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 } },
  { model: "claude-opus-4-5-20251101", display: "claude-opus-4-5", provider: "claude",
    price: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 } },
  { model: "claude-sonnet-4-6", display: "claude-sonnet-4-6", provider: "claude",
    price: { input: 3, output: 15, cacheRead: 1, cacheWrite: 3 } },
  { model: "claude-sonnet-4-5-20250929", display: "claude-sonnet-4-5", provider: "claude",
    price: { input: 3, output: 15, cacheRead: 1, cacheWrite: 3 } },
  { model: "claude-haiku-4-5-20251001", display: "claude-haiku-4-5", provider: "claude",
    price: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }, badge: "性价比" },
];

// ────────────────────────────────────────────────────────────────
// OpenAI — 4 个(thinkai 当前已下架 gpt-5.2 和 gpt-image-2)
// ────────────────────────────────────────────────────────────────

const GPT: ModelRow[] = [
  { model: "gpt-5.5", display: "gpt-5.5", provider: "gpt",
    price: { input: 5, output: 30, cacheRead: 0.5 }, badge: "旗舰" },
  { model: "gpt-5.4", display: "gpt-5.4", provider: "gpt",
    price: { input: 2.5, output: 15, cacheRead: 0.25 } },
  { model: "gpt-5.3-codex", display: "gpt-5.3-codex", provider: "gpt",
    price: { input: 1.75, output: 14, cacheRead: 0.175 }, badge: "Codex" },
  { model: "gpt-5.4-mini", display: "gpt-5.4-mini", provider: "gpt",
    price: { input: 0.75, output: 4.5, cacheRead: 0.075 }, badge: "性价比" },
];

// ────────────────────────────────────────────────────────────────
// Google Gemini — 5 个(thinkai 当前已下架 -low 变体和 flash-lite)
// ────────────────────────────────────────────────────────────────

const GEMINI: ModelRow[] = [
  { model: "gemini-3-pro-high", display: "gemini-3-pro-high", provider: "gemini",
    price: { input: 2, output: 12, cacheRead: 2, cacheWrite: 4.5 }, badge: "旗舰" },
  { model: "gemini-3-pro-preview", display: "gemini-3-pro-preview", provider: "gemini",
    price: { input: 2, output: 12, cacheRead: 2, cacheWrite: 4.5 } },
  { model: "gemini-3.1-pro-high", display: "gemini-3.1-pro-high", provider: "gemini",
    price: { input: 2, output: 12, cacheRead: 2, cacheWrite: 4.5 } },
  { model: "gemini-3-flash", display: "gemini-3-flash", provider: "gemini",
    price: { input: 2, output: 12, cacheRead: 2, cacheWrite: 4 } },
  { model: "gemini-2.5-flash", display: "gemini-2.5-flash", provider: "gemini",
    price: { input: 2, output: 12, cacheRead: 2, cacheWrite: 4 }, badge: "性价比" },
];

// ────────────────────────────────────────────────────────────────
// Public exports
// ────────────────────────────────────────────────────────────────

export const PROVIDERS: ProviderTab[] = [
  {
    id: "claude",
    name: "Anthropic",
    tabLabel: "Claude",
    description: "Claude 全系模型，opus / sonnet / haiku 主线。",
    full: CLAUDE,
  },
  {
    id: "gpt",
    name: "OpenAI",
    tabLabel: "GPT",
    description: "GPT-5 全系模型，含 codex、mini。",
    full: GPT,
  },
  {
    id: "gemini",
    name: "Google",
    tabLabel: "Gemini",
    description: "Gemini 3 系列与 2.5 Flash。",
    full: GEMINI,
  },
];

export const ALL_MODELS: ModelRow[] = [...CLAUDE, ...GPT, ...GEMINI];

// ────────────────────────────────────────────────────────────────
// Money math
// ────────────────────────────────────────────────────────────────

/** 用户实际扣的人民币(单位: ¥ per 1M tokens) */
export function ourRmb(usd: number, provider: Provider): number {
  return usd * GROUP_RATIO[provider] * TOPUP_RATE;
}

/** 用户实际扣的美元额度(单位: $ per 1M tokens),= USD × group_ratio */
export function ourUsd(usd: number, provider: Provider): number {
  return usd * GROUP_RATIO[provider];
}

/** 官方按真实汇率换算的人民币(单位: ¥ per 1M tokens) */
export function officialRmb(usd: number): number {
  return usd * USD_TO_CNY;
}

/** 同 provider 内所有行节省比例相同(只与倍率和汇率有关) */
export function savingsPercentFor(provider: Provider): number {
  return Math.max(
    0,
    Math.round((1 - (GROUP_RATIO[provider] * TOPUP_RATE) / USD_TO_CNY) * 100),
  );
}

/** 兼容老 API:按 row 算节省 */
export function savingsPercent(row: ModelRow): number {
  return savingsPercentFor(row.provider);
}

/** 取一组 rows 里的最大节省值 */
export function maxSavings(rows: ModelRow[]): number {
  return rows.reduce((m, r) => Math.max(m, savingsPercent(r)), 0);
}

/** 格式化人民币金额。
 *  ≥ ¥10 → 1 位小数
 *  ≥ ¥1  → 2 位小数
 *  ≥ ¥0.10 → 3 位小数
 *  其他   → 4 位小数
 */
export function formatRmb(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 10) return `¥${n.toFixed(1)}`;
  if (n >= 1) return `¥${n.toFixed(2)}`;
  if (n >= 0.1) return `¥${n.toFixed(3)}`;
  return `¥${n.toFixed(4)}`;
}

/** 格式化美元金额(用于控制台余额、累计消耗等) */
export function formatUsd(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 100) return `$${n.toFixed(2)}`;
  if (n >= 1) return `$${n.toFixed(3)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

/** USD 余额 → 等价人民币(按充值汇率 TOPUP_RATE) */
export function usdToRmbBalance(usd: number): number {
  return usd * TOPUP_RATE;
}
