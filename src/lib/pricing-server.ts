import "server-only";

import type { PricingPayload } from "./pricing";

/**
 * 服务端拉 /api/pricing 公开 endpoint。
 *
 * 缓存策略:revalidate 60s + tag 'pricing'。
 * 想立即让前端跟随后台改动,服务端 action 里调 revalidateTag('pricing') 即可。
 *
 * URL 优先级:
 *   1) process.env.PRICING_API_URL  完整 URL，调试/反代时可指定
 *   2) process.env.API_BASE         同站点其他 endpoint 共用 base
 *   3) https://zhongzhuantoken.com  生产兜底
 */

const DEFAULT_BASE = "https://zhongzhuantoken.com";

function pricingUrl(): string {
  if (process.env.PRICING_API_URL) return process.env.PRICING_API_URL;
  const base = process.env.API_BASE || DEFAULT_BASE;
  return `${base.replace(/\/$/, "")}/api/pricing`;
}

export async function fetchPricing(): Promise<PricingPayload | null> {
  try {
    const res = await fetch(pricingUrl(), {
      next: { revalidate: 60, tags: ["pricing"] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PricingPayload;
    if (!json?.success || !Array.isArray(json.data)) return null;
    return json;
  } catch {
    return null;
  }
}
