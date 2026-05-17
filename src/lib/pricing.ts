/**
 * Model pricing data + billing math.
 *
 * 真实算法(对照站点后台 New API 设置):
 * ──────────────────────────────────────────────────────────────
 * · 充值比例: ¥0.46 → $1 余额(固定，与人民币汇率脱钩)
 * · 消耗倍率(group_ratio):
 *     - GPT / Gemini: 1× → 用 $1 显示价时，扣 $1 余额 = ¥0.46
 *     - Claude(全系): 3× → 用 $1 显示价时，扣 $3 余额 = ¥1.38
 * · 我家"实际人民币成本" = official_usd × ratio × TOPUP_RATE
 * · 对比官方"真实人民币成本" = official_usd × USD_TO_CNY (按真实汇率 ≈ 7)
 * · 节省比例 = 1 − ratio × TOPUP_RATE / USD_TO_CNY
 *     - GPT/Gemini: 1 − 0.46/7 ≈ 93%
 *     - Claude:     1 − 3×0.46/7 ≈ 80%
 *
 * 想调整:
 * · 充值比例 → TOPUP_RATE
 * · 真实汇率 → USD_TO_CNY
 * · 某家倍率 → GROUP_RATIO
 * · 单个模型价 → 改 LineItem.price
 */

export const TOPUP_RATE = 0.46; // ¥ per $ of balance
export const USD_TO_CNY = 7; // official market rate, used only for savings comparison

export type Provider = "claude" | "gpt";

export const GROUP_RATIO: Record<Provider, number> = {
  claude: 3,
  gpt: 1,
};

export type Price = {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite5m?: number;
  cacheWrite1h?: number;
};

export type ModelRow = {
  model: string;
  display: string;
  provider: Provider;
  /** Official USD prices per 1M tokens (from Anthropic / OpenAI docs). */
  price: Price;
  /** Optional badge text (e.g. "旗舰", "Codex", "Thinking"). */
  badge?: string;
};

export type ProviderTab = {
  id: Provider;
  name: string;
  tabLabel: string;
  description: string;
  featured: ModelRow[];
  full: ModelRow[];
};

// ────────────────────────────────────────────────────────────────
// Anthropic 官方价(2026-05 抓取自 platform.claude.com/docs/.../pricing)
// ────────────────────────────────────────────────────────────────

const OPUS_4X = { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 };
const OPUS_LEGACY = { input: 15, output: 75, cacheRead: 1.5, cacheWrite5m: 18.75, cacheWrite1h: 30 };
const SONNET_4X = { input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75, cacheWrite1h: 6 };
const HAIKU_4_5 = { input: 1, output: 5, cacheRead: 0.1, cacheWrite5m: 1.25, cacheWrite1h: 2 };

const CLAUDE_FEATURED: ModelRow[] = [
  { model: "claude-opus-4-7", display: "claude-opus-4-7", provider: "claude", price: OPUS_4X, badge: "旗舰" },
  { model: "claude-opus-4-6", display: "claude-opus-4-6", provider: "claude", price: OPUS_4X },
  { model: "claude-opus-4-5-20251101", display: "claude-opus-4-5", provider: "claude", price: OPUS_4X },
  { model: "claude-haiku-4-5-20251001", display: "claude-haiku-4-5", provider: "claude", price: HAIKU_4_5, badge: "性价比" },
];

const CLAUDE_VARIANTS: ModelRow[] = [
  // Opus 4.7 effort
  { model: "claude-opus-4-7-high", display: "claude-opus-4-7-high", provider: "claude", price: OPUS_4X, badge: "Effort" },
  { model: "claude-opus-4-7-low", display: "claude-opus-4-7-low", provider: "claude", price: OPUS_4X, badge: "Effort" },
  // Opus 4.6 effort
  { model: "claude-opus-4-6-high", display: "claude-opus-4-6-high", provider: "claude", price: OPUS_4X, badge: "Effort" },
  { model: "claude-opus-4-6-low", display: "claude-opus-4-6-low", provider: "claude", price: OPUS_4X, badge: "Effort" },
  { model: "claude-opus-4-6-medium", display: "claude-opus-4-6-medium", provider: "claude", price: OPUS_4X, badge: "Effort" },
  { model: "claude-opus-4-6-max", display: "claude-opus-4-6-max", provider: "claude", price: OPUS_4X, badge: "Effort" },
  // Thinking variants — same price as base
  { model: "claude-opus-4-7-thinking", display: "claude-opus-4-7-thinking", provider: "claude", price: OPUS_4X, badge: "Thinking" },
  { model: "claude-opus-4-6-thinking", display: "claude-opus-4-6-thinking", provider: "claude", price: OPUS_4X, badge: "Thinking" },
  { model: "claude-opus-4-5-20251101-thinking", display: "claude-opus-4-5-thinking", provider: "claude", price: OPUS_4X, badge: "Thinking" },
  // Legacy Opus(官方价更高，节省百分比更亮眼)
  { model: "claude-opus-4-1-20250805", display: "claude-opus-4-1", provider: "claude", price: OPUS_LEGACY },
  { model: "claude-opus-4-1-20250805-thinking", display: "claude-opus-4-1-thinking", provider: "claude", price: OPUS_LEGACY, badge: "Thinking" },
  { model: "claude-opus-4-20250514", display: "claude-opus-4", provider: "claude", price: OPUS_LEGACY },
  { model: "claude-opus-4-20250514-thinking", display: "claude-opus-4-thinking", provider: "claude", price: OPUS_LEGACY, badge: "Thinking" },
];

// ────────────────────────────────────────────────────────────────
// OpenAI 官方价(2026-05 抓取自 openai.com/api/pricing)
// ────────────────────────────────────────────────────────────────

const GPT_FEATURED: ModelRow[] = [
  { model: "gpt-5.5", display: "gpt-5.5", provider: "gpt",
    price: { input: 5, output: 30, cacheRead: 0.5 }, badge: "旗舰" },
  { model: "gpt-5.4", display: "gpt-5.4", provider: "gpt",
    price: { input: 2.5, output: 15, cacheRead: 0.25 } },
  { model: "gpt-5.4-mini", display: "gpt-5.4-mini", provider: "gpt",
    price: { input: 0.75, output: 4.5, cacheRead: 0.075 }, badge: "性价比" },
  { model: "gpt-5.3-codex", display: "gpt-5.3-codex", provider: "gpt",
    price: { input: 2, output: 16, cacheRead: 0.15 }, badge: "Codex" },
  { model: "gpt-5.2", display: "gpt-5.2", provider: "gpt",
    price: { input: 1, output: 8 } },
];

// ────────────────────────────────────────────────────────────────
// Public exports
// ────────────────────────────────────────────────────────────────

export const PROVIDERS: ProviderTab[] = [
  {
    id: "claude",
    name: "Anthropic",
    tabLabel: "Claude",
    description: "Claude 全系模型，含 opus / haiku 主线与 thinking / effort 变体。",
    featured: CLAUDE_FEATURED,
    full: [...CLAUDE_FEATURED, ...CLAUDE_VARIANTS],
  },
  {
    id: "gpt",
    name: "OpenAI",
    tabLabel: "GPT",
    description: "GPT-5 全系模型，含主线、mini、codex 变体。",
    featured: GPT_FEATURED,
    full: GPT_FEATURED,
  },
];

// ────────────────────────────────────────────────────────────────
// Money math
// ────────────────────────────────────────────────────────────────

/** 用户实际扣的人民币(单位: ¥ per 1M tokens) */
export function ourRmb(usd: number, provider: Provider): number {
  return usd * GROUP_RATIO[provider] * TOPUP_RATE;
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

/** 取一组 rows 里的最大节省值(用于 tab banner) */
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
