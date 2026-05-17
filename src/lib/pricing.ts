/**
 * Model pricing data.
 *
 * - `ours`: 本站售价(USD per 1M tokens),数据来源于线上 /pricing
 * - `official`: 上游官方标准价(USD per 1M tokens) — TODO: 用户需替换为真实官方价
 *
 * 节省百分比由 `formatSavings()` 自动计算。
 */

export type Price = {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
};

export type ModelRow = {
  /** model name as exposed via API */
  model: string;
  /** short display name for the simplified table (no provider prefix) */
  display: string;
  ours: Price;
  official: Price;
  /** optional badge text (e.g. "新", "Codex", "Thinking") */
  badge?: string;
};

export type ProviderTab = {
  id: "claude" | "gpt";
  name: string;
  /** label rendered on the tab trigger */
  tabLabel: string;
  /** copy under the big title */
  description: string;
  /** featured models for the homepage simplified table (4-5 rows) */
  featured: ModelRow[];
  /** full lineup for /pricing detail page */
  full: ModelRow[];
};

// ───────────────────────────── Claude ─────────────────────────────

const CLAUDE_FEATURED: ModelRow[] = [
  {
    model: "claude-opus-4-7",
    display: "claude-opus-4-7",
    ours: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    official: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
    badge: "旗舰",
  },
  {
    model: "claude-opus-4-6",
    display: "claude-opus-4-6",
    ours: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    official: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  },
  {
    model: "claude-opus-4-5-20251101",
    display: "claude-opus-4-5",
    ours: { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
    official: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  },
  {
    model: "claude-haiku-4-5-20251001",
    display: "claude-haiku-4-5",
    ours: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
    official: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
    badge: "性价比",
  },
];

const CLAUDE_VARIANTS: ModelRow[] = [
  { model: "claude-opus-4-7-high", display: "claude-opus-4-7-high",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-7-low", display: "claude-opus-4-7-low",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-6-high", display: "claude-opus-4-6-high",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-6-low", display: "claude-opus-4-6-low",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-6-medium", display: "claude-opus-4-6-medium",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-6-max", display: "claude-opus-4-6-max",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Effort" },
  { model: "claude-opus-4-7-thinking", display: "claude-opus-4-7-thinking",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Thinking" },
  { model: "claude-opus-4-6-thinking", display: "claude-opus-4-6-thinking",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Thinking" },
  { model: "claude-opus-4-5-20251101-thinking", display: "claude-opus-4-5-thinking",
    ours: { input: 5, output: 25, cacheRead: 0.5 }, official: { input: 15, output: 75, cacheRead: 1.5 }, badge: "Thinking" },
  { model: "claude-opus-4-1-20250805", display: "claude-opus-4-1",
    ours: { input: 5, output: 25 }, official: { input: 15, output: 75 } },
  { model: "claude-opus-4-1-20250805-thinking", display: "claude-opus-4-1-thinking",
    ours: { input: 5, output: 25 }, official: { input: 15, output: 75 }, badge: "Thinking" },
  { model: "claude-opus-4-20250514", display: "claude-opus-4",
    ours: { input: 5, output: 25 }, official: { input: 15, output: 75 } },
  { model: "claude-opus-4-20250514-thinking", display: "claude-opus-4-thinking",
    ours: { input: 5, output: 25 }, official: { input: 15, output: 75 }, badge: "Thinking" },
];

// ───────────────────────────── GPT ─────────────────────────────

const GPT_FEATURED: ModelRow[] = [
  {
    model: "gpt-5.5",
    display: "gpt-5.5",
    ours: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 5 },
    official: { input: 10, output: 60, cacheRead: 1, cacheWrite: 10 },
    badge: "旗舰",
  },
  {
    model: "gpt-5.4",
    display: "gpt-5.4",
    ours: { input: 2.5, output: 15, cacheRead: 0.25, cacheWrite: 2.5 },
    official: { input: 5, output: 30, cacheRead: 0.5, cacheWrite: 5 },
  },
  {
    model: "gpt-5.4-mini",
    display: "gpt-5.4-mini",
    ours: { input: 0.75, output: 4.5, cacheRead: 0.075, cacheWrite: 0.75 },
    official: { input: 1.5, output: 9, cacheRead: 0.15, cacheWrite: 1.5 },
    badge: "性价比",
  },
  {
    model: "gpt-5.3-codex",
    display: "gpt-5.3-codex",
    ours: { input: 2, output: 16, cacheRead: 0.15, cacheWrite: 1.5 },
    official: { input: 4, output: 32, cacheRead: 0.3, cacheWrite: 3 },
    badge: "Codex",
  },
  {
    model: "gpt-5.2",
    display: "gpt-5.2",
    ours: { input: 1, output: 8 },
    official: { input: 2, output: 16 },
  },
];

// ───────────────────────────── Public ─────────────────────────────

export const PROVIDERS: ProviderTab[] = [
  {
    id: "claude",
    name: "Anthropic",
    tabLabel: "Claude",
    description: "Claude 全系模型,含 opus / sonnet / haiku 与 thinking / effort 变体。",
    featured: CLAUDE_FEATURED,
    full: [...CLAUDE_FEATURED, ...CLAUDE_VARIANTS],
  },
  {
    id: "gpt",
    name: "OpenAI",
    tabLabel: "GPT",
    description: "GPT-5 全系模型,含主线、mini、codex 与动态计费版本。",
    featured: GPT_FEATURED,
    full: GPT_FEATURED,
  },
];

/**
 * 美元 → 人民币换算汇率。
 *
 * 行业惯例:中转站显示美元价,但实际按 1 USD = 1 CNY 从余额扣人民币。
 * 节省百分比基于"我家扣的 RMB"对比"官方扣的 RMB(= 官方美元 × 汇率)"计算。
 *
 * 想改汇率(比如官方人民币结算或者不同的兑换比例),只改这一个常量。
 */
export const USD_TO_CNY_RATE = 7;

/**
 * 节省百分比,基于输出价(主要成本)对比"折算后的官方人民币价"。
 * 计算口径:`1 - (ours_usd_displayed) / (official_usd × rate)`
 */
export function savingsPercent(row: ModelRow): number {
  const off = row.official.output * USD_TO_CNY_RATE;
  const ours = row.ours.output;
  if (off <= 0) return 0;
  return Math.max(0, Math.round((1 - ours / off) * 100));
}

/** Max savings across all featured models in a tab — used for the title chip. */
export function maxSavings(rows: ModelRow[]): number {
  return rows.reduce((max, r) => Math.max(max, savingsPercent(r)), 0);
}

export function formatPrice(n: number | undefined): string {
  if (n === undefined) return "—";
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}
