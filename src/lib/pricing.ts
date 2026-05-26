/**
 * 价格数据模型 + 计价数学。
 *
 * 架构原则:**后端 = 唯一真相，前端 = 展示皮**
 * ─────────────────────────────────────────────────────
 * 模型/分组/倍率/价格 全部从 New API /api/pricing 公开 endpoint 拉取，
 * 前端只保留 "装饰层"(MODEL_BADGES / TAB_ORDER / VENDOR_DISPLAY)
 * 控制营销表现。后台改什么前台 60 秒内自动跟随，不需要改这份代码。
 *
 * 数据转换:
 * · 每千 token 美元价 = model_ratio × 0.002 (New API 内部用 davinci 旧基准)
 * · 每百万 token 美元价 = model_ratio × 2
 * · 输出价 = model_ratio × completion_ratio × 2
 * · 缓存读 = model_ratio × cache_ratio × 2
 * · 缓存写 = model_ratio × create_cache_ratio × 2
 *
 * 用户实际扣费:
 * · 扣的美元额度 = 官方美元价 × group_ratio
 * · 等值人民币 = 扣的美元额度 × TOPUP_RATE
 * · 节省比例 = 1 − group_ratio × TOPUP_RATE / USD_TO_CNY
 */

// ────────────────────────────────────────────────────────────────
// 货币基准(前端独立维护，与后端无关)
// ────────────────────────────────────────────────────────────────

export const TOPUP_RATE = 0.42; // ¥ per $1 余额
export const USD_TO_CNY = 7;    // 真实市场汇率，仅用于节省比例对照

// ────────────────────────────────────────────────────────────────
// Raw types — 直接对应 /api/pricing 响应
// ────────────────────────────────────────────────────────────────

export type RawModel = {
  model_name: string;
  vendor_id: number;
  quota_type: number;
  model_ratio: number;
  model_price: number;           // > 0 = 按次计费，否则按 token
  owner_by: string;
  completion_ratio: number;
  cache_ratio: number;
  create_cache_ratio: number;
  enable_groups: string[];
  supported_endpoint_types: string[];
  pricing_version?: string;
};

export type Vendor = {
  id: number;
  name: string;
  icon: string;
};

export type PricingPayload = {
  success: boolean;
  data: RawModel[];
  group_ratio: Record<string, number>;
  usable_group: Record<string, string>;
  vendors: Vendor[];
  auto_groups: string[];
  pricing_version: string;
  supported_endpoint: Record<string, { path: string; method: string }>;
};

export type Price = {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
};

// ────────────────────────────────────────────────────────────────
// 装饰层 — 前端唯一控制点
// 想给新模型/新组加营销表现，改这里就够，不影响后端数据流
// ────────────────────────────────────────────────────────────────

export type Badge = "旗舰" | "性价比" | "Codex";

/** 模型徽章。后台加新模型时若想给它加徽章，在这里加一行 */
export const MODEL_BADGES: Record<string, Badge> = {
  "claude-opus-4-7": "旗舰",
  "claude-sonnet-4-6": "旗舰",
  "claude-haiku-4-5-20251001": "性价比",
  "gpt-5.5": "旗舰",
  "gpt-5.4-mini": "性价比",
  "gpt-5.3-codex": "Codex",
  "gemini-3-pro-high": "旗舰",
  "gemini-2.5-flash": "性价比",
};

export type GroupTone = "brand" | "amber" | "sky" | "muted";

/**
 * Tab 配置:一个 tab 绑一个后端分组,可选按 vendor 过滤。
 * "GPT/Gemini" 后端是单一分组,前端拆成 GPT / Gemini 两个 tab 展示。
 * tab 顺序就是数组顺序。
 *
 * 后台加了新组? 前端不会自动出现 tab,必须在这里登记(显式控制营销表现)。
 * 后台从某组里移光所有模型? tab 仍展示,但自动标"维护中"(buildTabViews 里判断)。
 */
export type TabSpec = {
  id: string;
  label: string;
  /** 对应 payload.group_ratio 的 key */
  group: string;
  /** 可选:仅展示这些 vendor_id 的模型(用于把 GPT/Gemini 拆成两 tab) */
  vendorIds?: number[];
  desc: string;
  tone: GroupTone;
  /** hero 区是否高亮(目前用于"最划算"角标) */
  highlight?: boolean;
};

export const TAB_ORDER: TabSpec[] = [
  {
    id: "gpt",
    label: "GPT",
    group: "GPT/Gemini",
    vendorIds: [1],
    desc: "官方直连",
    tone: "sky",
  },
  {
    id: "gemini",
    label: "Gemini",
    group: "GPT/Gemini",
    vendorIds: [3],
    desc: "官方直连",
    tone: "sky",
  },
  {
    id: "claude-lite",
    label: "Claude Lite",
    group: "claude lite",
    desc: "Claude 第三方渠道，性价比之选",
    tone: "brand",
    highlight: true,
  },
  {
    id: "claude-plus",
    label: "Claude Plus",
    group: "claude plus",
    desc: "Claude AWS 逆向号池",
    tone: "amber",
  },
  {
    id: "claude-max",
    label: "Claude Max",
    group: "claude max",
    desc: "Claude 官方满血 Max 直连",
    tone: "amber",
  },
];

/**
 * 给 token form / 行展示用的"分组人话名"。
 * 跟 tab label 不同:GPT/Gemini 是一个分组,在 token form 里显示为 "GPT / Gemini"。
 */
const GROUP_LABELS: Record<string, string> = {
  "claude lite": "Claude Lite",
  "claude plus": "Claude Plus",
  "claude max": "Claude Max",
  "GPT/Gemini": "GPT / Gemini",
};

export function groupLabel(name: string): string {
  return GROUP_LABELS[name] ?? name;
}

/** vendor_id 到展示信息(label/icon 名)。后端 vendors 已含 name+icon，这里只做兜底 */
export const VENDOR_DISPLAY: Record<number, { label: string; tabLabel: string }> = {
  1: { label: "OpenAI", tabLabel: "GPT" },
  2: { label: "Anthropic", tabLabel: "Claude" },
  3: { label: "Google", tabLabel: "Gemini" },
};

export function vendorDisplay(v: Vendor): { label: string; tabLabel: string } {
  return VENDOR_DISPLAY[v.id] ?? { label: v.name, tabLabel: v.name };
}

// ────────────────────────────────────────────────────────────────
// 计算函数
// ────────────────────────────────────────────────────────────────

/** 厂商官方美元价(每 1M tokens)，从 New API model_ratio 反推 */
export function officialPriceFromModel(m: RawModel): Price {
  return {
    input: m.model_ratio * 2,
    output: m.model_ratio * m.completion_ratio * 2,
    cacheRead:
      m.cache_ratio > 0 ? m.model_ratio * m.cache_ratio * 2 : undefined,
    cacheWrite:
      m.create_cache_ratio > 0
        ? m.model_ratio * m.create_cache_ratio * 2
        : undefined,
  };
}

/** 用户实际扣的美元额度(= 官方价 × group_ratio) */
export function userPricedUsd(p: Price, groupRatio: number): Price {
  const apply = (n?: number) => (n == null ? undefined : n * groupRatio);
  return {
    input: p.input * groupRatio,
    output: p.output * groupRatio,
    cacheRead: apply(p.cacheRead),
    cacheWrite: apply(p.cacheWrite),
  };
}

/** 美元额度 → 等值人民币(按充值汇率) */
export function rmbFromUsd(usd: number): number {
  return usd * TOPUP_RATE;
}

/** 官方按真实市场汇率折算的人民币(用于对照划线) */
export function officialRmb(usd: number): number {
  return usd * USD_TO_CNY;
}

/** 用户在某组下的实际人民币(每 1M tokens 单价) */
export function userRmb(officialUsd: number, groupRatio: number): number {
  return officialUsd * groupRatio * TOPUP_RATE;
}

/** 单个 group_ratio 对应的节省比例 */
export function savingsPercentForRatio(groupRatio: number): number {
  return Math.max(
    0,
    Math.round((1 - (groupRatio * TOPUP_RATE) / USD_TO_CNY) * 100),
  );
}

/** 一组 group_ratio map 里最低 ratio 对应的最大节省比例(用作首页 headline) */
export function maxSavingsAcrossGroups(
  groupRatios: Record<string, number>,
): number {
  const ratios = Object.values(groupRatios);
  if (ratios.length === 0) return 0;
  const minRatio = Math.min(...ratios);
  return savingsPercentForRatio(minRatio);
}

/** 找一组 ratio 里 ratio 最低的那个组名(headline 用) */
export function cheapestGroup(
  groupRatios: Record<string, number>,
): { name: string; ratio: number } | null {
  const entries = Object.entries(groupRatios);
  if (entries.length === 0) return null;
  return entries
    .map(([name, ratio]) => ({ name, ratio }))
    .reduce((a, b) => (a.ratio <= b.ratio ? a : b));
}

// ────────────────────────────────────────────────────────────────
// 格式化
// ────────────────────────────────────────────────────────────────

/** 人民币金额。
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

/** 美元金额(控制台余额、累计消耗等场景) */
export function formatUsd(n: number | undefined): string {
  if (n === undefined) return "—";
  if (n >= 100) return `$${n.toFixed(2)}`;
  if (n >= 1) return `$${n.toFixed(3)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

/** USD 余额 → 等价人民币(按充值汇率) */
export function usdToRmbBalance(usd: number): number {
  return usd * TOPUP_RATE;
}

// ────────────────────────────────────────────────────────────────
// 数据视图组装(供 UI 用)
// ────────────────────────────────────────────────────────────────

/** 一行价格的完整视图(含原始模型 + 组上下文 + 计算好的价格) */
export type PricedRow = {
  model: RawModel;
  badge?: Badge;
  vendor: Vendor;
  group: string;
  groupRatio: number;
  /** 官方美元价(per 1M tokens) */
  official: Price;
  /** 用户实际扣的美元额度(per 1M tokens) */
  user: Price;
  /** 用户实际人民币单价(per 1M tokens，输入/输出/缓存读/缓存写各自) */
  userRmb: Price;
};

/** 按 tab 聚合 + 按 vendor 分块的完整视图,供价格表组件直接渲染 */
export type TabView = {
  /** 唯一 id(来自 TabSpec.id) */
  id: string;
  /** 显示名 */
  label: string;
  /** 营销描述 */
  desc: string;
  tone: GroupTone;
  highlight?: boolean;
  /** 后端真实分组名 */
  group: string;
  /** 倍率(从 group_ratio 取) */
  ratio: number;
  /** 该 tab 下按 vendor 分组的模型块,空 block 会被剔除 */
  blocks: Array<{
    vendor: Vendor;
    rows: PricedRow[];
  }>;
  /** 节省比例 */
  savings: number;
  /** 模型总数(已过滤 vendorIds 后) */
  totalModels: number;
  /** 维护中:后端有该组但没有匹配模型(可能在配置或维护) */
  maintenance: boolean;
};

/** Badge 排序:旗舰 > 性价比/Codex > 无 */
const badgeRank: Record<string, number> = {
  "旗舰": 0,
  "性价比": 1,
  "Codex": 1,
};

function rowSortKey(r: PricedRow): [number, number, string] {
  const rank = r.badge ? badgeRank[r.badge] ?? 2 : 2;
  return [rank, r.official.input, r.model.model_name];
}

/**
 * 把 raw payload 按 TAB_ORDER 转成 tab 视图。
 *
 * 规则:
 *  - tab 顺序 = TAB_ORDER 顺序(显式控制)
 *  - 后端不存在该组(group_ratio 里没 key) → 跳过该 tab
 *  - 后端有该组但 0 匹配模型 → tab 仍出现,标 maintenance=true
 *  - vendorIds 过滤:仅展示这些 vendor_id 的模型(用于把 GPT/Gemini 拆成 2 tab)
 */
export function buildTabViews(payload: PricingPayload): TabView[] {
  const vendorById = new Map(payload.vendors.map((v) => [v.id, v]));
  const views: TabView[] = [];

  for (const tab of TAB_ORDER) {
    const ratio = payload.group_ratio[tab.group];
    if (ratio === undefined) continue; // 后端没这个组,跳过

    // 候选模型:在该组里 + 通过 vendor 过滤
    const candidates = payload.data.filter((m) => {
      if (!m.enable_groups?.includes(tab.group)) return false;
      if (tab.vendorIds && !tab.vendorIds.includes(m.vendor_id)) return false;
      return true;
    });

    // 按 vendor 分块(候选可能为空 → maintenance)
    const byVendor = new Map<number, PricedRow[]>();
    for (const m of candidates) {
      const v = vendorById.get(m.vendor_id);
      if (!v) continue;
      const official = officialPriceFromModel(m);
      const user = userPricedUsd(official, ratio);
      const row: PricedRow = {
        model: m,
        badge: MODEL_BADGES[m.model_name],
        vendor: v,
        group: tab.group,
        groupRatio: ratio,
        official,
        user,
        userRmb: {
          input: user.input * TOPUP_RATE,
          output: user.output * TOPUP_RATE,
          cacheRead:
            user.cacheRead != null ? user.cacheRead * TOPUP_RATE : undefined,
          cacheWrite:
            user.cacheWrite != null ? user.cacheWrite * TOPUP_RATE : undefined,
        },
      };
      const arr = byVendor.get(v.id) ?? [];
      arr.push(row);
      byVendor.set(v.id, arr);
    }

    const blocks = Array.from(byVendor.entries())
      .map(([vid, rows]) => {
        const vendor = vendorById.get(vid)!;
        rows.sort((a, b) => {
          const ka = rowSortKey(a);
          const kb = rowSortKey(b);
          if (ka[0] !== kb[0]) return ka[0] - kb[0];
          if (ka[1] !== kb[1]) return ka[1] - kb[1];
          return ka[2].localeCompare(kb[2]);
        });
        return { vendor, rows };
      })
      .sort((a, b) => a.vendor.id - b.vendor.id);

    views.push({
      id: tab.id,
      label: tab.label,
      desc: tab.desc,
      tone: tab.tone,
      highlight: tab.highlight,
      group: tab.group,
      ratio,
      blocks,
      savings: savingsPercentForRatio(ratio),
      totalModels: candidates.length,
      maintenance: candidates.length === 0,
    });
  }

  return views;
}
