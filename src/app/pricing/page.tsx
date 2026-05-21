import { PricingExplorer } from "@/components/pricing-explorer";
import { GROUP_RATIO, TOPUP_RATE, USD_TO_CNY } from "@/lib/pricing";

export const metadata = {
  title: "价格 — Zhongzhuan Token",
  description: `Claude · GPT-5 · Gemini 全系完整价格。¥${TOPUP_RATE} = $1 美元额度，按官方价 × 分组倍率扣费(Claude ${GROUP_RATIO.claude}×、GPT ${GROUP_RATIO.gpt}×、Gemini ${GROUP_RATIO.gemini}×)。`,
};

export default function PricingPage() {
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
            Claude · GPT-5 · Gemini 全系，共 15 个模型。
            主价是你的实际人民币成本，下方灰字是官方按真实汇率 <span className="font-mono text-foreground">¥{USD_TO_CNY}/$1</span> 折算的成本对照。
            每个 tab 底部都有该厂商的计价公式和旗舰举例;
            模型名后的 <span className="font-mono text-amber-600 dark:text-amber-400">×{GROUP_RATIO.claude}</span> / <span className="font-mono text-sky-600 dark:text-sky-400">×{GROUP_RATIO.gpt}</span> 徽标表示该厂商的分组倍率。
          </p>
        </div>

        <PricingExplorer />

        <div className="mt-12 border border-border bg-secondary/30 p-6 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
          <div className="mb-3 font-semibold text-foreground">计价规则速查</div>
          <ul className="space-y-1.5">
            <li>· 充值汇率固定 <span className="text-foreground">¥{TOPUP_RATE} = $1 美元额度</span>(不随人民币汇率波动)</li>
            <li>· Claude 全系倍率 <span className="text-amber-600 dark:text-amber-400">{GROUP_RATIO.claude}×</span>:消耗 $1 标价 = 扣 ${GROUP_RATIO.claude} 美元额度 = ¥{(GROUP_RATIO.claude * TOPUP_RATE).toFixed(2)}</li>
            <li>· GPT 全系倍率 <span className="text-sky-600 dark:text-sky-400">{GROUP_RATIO.gpt}×</span>:消耗 $1 标价 = 扣 ${GROUP_RATIO.gpt} 美元额度 = ¥{(GROUP_RATIO.gpt * TOPUP_RATE).toFixed(2)}</li>
            <li>· Gemini 全系倍率 <span className="text-sky-600 dark:text-sky-400">{GROUP_RATIO.gemini}×</span>:消耗 $1 标价 = 扣 ${GROUP_RATIO.gemini} 美元额度 = ¥{(GROUP_RATIO.gemini * TOPUP_RATE).toFixed(2)}</li>
            <li>· 输入 / 输出 / 缓存读取 / 缓存写入 分别按各自单价计费</li>
            <li>· 缓存读取通常为输入价 1/10(Anthropic / OpenAI 系统行为)，命中可大幅省钱</li>
            <li>· 划线对照价 = 厂商官方 USD × ¥{USD_TO_CNY}/$1(等于你不用我们直接走官方的成本)</li>
            <li>· 节省比例 = 1 − 我们扣的 RMB / 官方折算 RMB(按 ¥{USD_TO_CNY}/$1)</li>
            <li>· 实际扣费以模型、分组、缓存命中情况为准</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
