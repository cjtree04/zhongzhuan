/**
 * 控制台金额格式化(美元主 + 人民币副)
 *
 * 我们站的"名义余额"是美元 quota,1 quota = 1 / quota_per_unit USD。
 * 控制台展示:
 *   主显示 = $X.XX (美元,大字)
 *   副显示 = ≈ ¥X.XX (人民币,小灰字,按充值汇率 TOPUP_RATE 换算)
 */

import { TOPUP_RATE } from "@/lib/pricing";
import type { SiteStatus } from "@/lib/api";

export const DEFAULT_QUOTA_PER_UNIT = 500000;

/** quota → 美元数字 */
export function quotaToUsd(quota: number, status: SiteStatus | null): number {
  const perUnit = status?.quota_per_unit || DEFAULT_QUOTA_PER_UNIT;
  return quota / perUnit;
}

/** quota → "$X.XX" 美元字符串(主显示) */
export function formatUsd(quota: number, status: SiteStatus | null): string {
  const usd = quotaToUsd(quota, status);
  if (usd >= 100) return `$${usd.toFixed(2)}`;
  if (usd >= 1) return `$${usd.toFixed(3)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(6)}`;
}

/** quota → "≈ ¥X.XX" 人民币换算(副显示,按充值汇率 0.4) */
export function formatRmbHint(quota: number, status: SiteStatus | null): string {
  const cny = quotaToUsd(quota, status) * TOPUP_RATE;
  if (cny >= 100) return `≈ ¥${cny.toFixed(0)}`;
  if (cny >= 10) return `≈ ¥${cny.toFixed(1)}`;
  if (cny >= 1) return `≈ ¥${cny.toFixed(2)}`;
  return `≈ ¥${cny.toFixed(3)}`;
}
