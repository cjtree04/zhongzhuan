import { PricingExplorer } from "@/components/pricing-explorer";
import {
  TOPUP_RATE,
  USD_TO_CNY,
  buildTabViews,
  maxSavingsAcrossGroups,
} from "@/lib/pricing";
import { fetchPricing } from "@/lib/pricing-server";

export const metadata = {
  title: "价格 — Zhongzhuan Token",
  description: `Claude · GPT · Gemini 全系完整价格，¥${TOPUP_RATE} = $1 美元额度，按官方价 × 分组倍率扣费。多个分组通道可选，价格随后台实时同步。`,
};

export default async function PricingPage() {
  const payload = await fetchPricing();
  const views = payload ? buildTabViews(payload) : [];
  const maxSavings = payload
    ? maxSavingsAcrossGroups(payload.group_ratio)
    : 0;

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand">
            PRICING · 完整价格表
          </div>
          <h1 className="font-mono text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-brand">¥{TOPUP_RATE}</span> = $1 美元额度
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            同一模型可在多个分组通道下使用，每个分组有独立倍率，价格按
            <span className="font-mono text-foreground"> 官方美元价 × 分组倍率 × ¥{TOPUP_RATE}</span> 折算成人民币。
            主价是你的实际成本，下方灰字是按真实汇率
            <span className="font-mono text-foreground"> ¥{USD_TO_CNY}/$1 </span>
            折算的官方价对照。
            {maxSavings > 0 ? (
              <> 最低倍率组对比官方价节省至 <span className="font-mono font-semibold text-brand">{maxSavings}%</span>。</>
            ) : null}
          </p>
        </div>

        <PricingExplorer views={views} />

        <div className="mt-12 border border-border bg-secondary/30 p-6 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
          <div className="mb-3 font-semibold text-foreground">计价规则速查</div>
          <ul className="space-y-1.5">
            <li>· 充值汇率固定 <span className="text-foreground">¥{TOPUP_RATE} = $1 美元额度</span>(不随人民币汇率波动)</li>
            <li>· 实际扣费 = 官方美元标价 × 分组倍率 × ¥{TOPUP_RATE}/$1</li>
            <li>· 同一模型可属于多个分组，token 调用时按 token 所绑定的分组扣费</li>
            <li>· 输入 / 输出 / 缓存读取 / 缓存写入 分别按各自单价计费</li>
            <li>· 缓存读取通常为输入价 1/10(Anthropic / OpenAI 系统行为)，命中可大幅省钱</li>
            <li>· 划线对照价 = 厂商官方 USD × ¥{USD_TO_CNY}/$1</li>
            <li>· 节省比例 = 1 − 我们扣的 RMB / 官方折算 RMB(按 ¥{USD_TO_CNY}/$1)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
