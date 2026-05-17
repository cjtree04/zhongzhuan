import { PricingExplorer } from "@/components/pricing-explorer";
import { GROUP_RATIO, TOPUP_RATE, USD_TO_CNY } from "@/lib/pricing";

export const metadata = {
  title: "价格 — Zhongzhuan Token",
  description:
    "Claude 全系 + GPT-5 全系完整价格。人民币按量结算,Claude 倍率 3×,GPT 倍率 1×。",
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
            所有模型 · 全部计价
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Claude 全系 · GPT-5 全系 · 含 thinking / effort / codex 等变体。
            价格已按你的实际扣费金额显示(人民币 ¥),
            充值比例固定 <span className="font-mono text-foreground">¥{TOPUP_RATE} → $1 余额</span>,
            Claude 类按 <span className="font-mono text-foreground">{GROUP_RATIO.claude}×</span> 倍率,
            GPT/Gemini 按 <span className="font-mono text-foreground">{GROUP_RATIO.gpt}×</span> 倍率。
            划线价是官方按真实汇率 <span className="font-mono text-foreground">¥{USD_TO_CNY}/$1</span> 折算的人民币成本。
          </p>
        </div>

        <PricingExplorer />

        <div className="mt-12 border border-border bg-secondary/30 p-6 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
          <div className="mb-3 font-semibold text-foreground">计价规则速查</div>
          <ul className="space-y-1.5">
            <li>· 充值比例固定 <span className="text-foreground">¥{TOPUP_RATE} = $1</span>(不随人民币汇率波动)</li>
            <li>· Claude 全系倍率 <span className="text-foreground">{GROUP_RATIO.claude}×</span>:消耗 $1 显示价时扣 ${GROUP_RATIO.claude} USD 余额 = ¥{(GROUP_RATIO.claude * TOPUP_RATE).toFixed(2)}</li>
            <li>· GPT / Gemini 倍率 <span className="text-foreground">{GROUP_RATIO.gpt}×</span>:消耗 $1 显示价时扣 ${GROUP_RATIO.gpt} USD 余额 = ¥{(GROUP_RATIO.gpt * TOPUP_RATE).toFixed(2)}</li>
            <li>· 输入 / 输出 / 缓存读取 / 缓存写入 分别按各自单价计费,均已折算成 ¥</li>
            <li>· 缓存读取通常为输入价 1/10(Anthropic 系统行为),5 分钟窗口</li>
            <li>· `-thinking` / `-high` / `-low` / `-max` 变体与主模型同价,差异在思考预算上限</li>
            <li>· 节省比例 = 你扣 RMB / 官方折算 RMB(按 ¥{USD_TO_CNY}/$1)</li>
            <li>· 实际扣费以模型、分组(default / vip)和缓存命中情况为准</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
