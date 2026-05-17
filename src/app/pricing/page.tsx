import { PricingExplorer } from "@/components/pricing-explorer";

export const metadata = {
  title: "价格 — Zhongzhuan Token",
  description: "Claude 全系 + GPT-5 全系完整价格,本站价 vs 官方价对比,缓存价分级透明。",
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
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Claude 全系 · GPT-5 全系 · 含 thinking / effort / codex
            等变体。价格按 USD per 1M tokens,实际扣费按人民币汇率结算,
            缓存读取按命中后单价独立计费。
          </p>
        </div>

        <PricingExplorer />

        <div className="mt-12 border border-border bg-secondary/30 p-6 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
          <div className="mb-2 font-semibold text-foreground">计价规则速查</div>
          <ul className="space-y-1.5">
            <li>· 输入 / 输出 / 缓存读取 / 缓存写入 分别按各自单价计费</li>
            <li>· 缓存命中按 cacheRead 单价(通常为输入价 1/10)结算,5 分钟窗口</li>
            <li>· 1h cacheWrite 适用部分 Claude 模型,长上下文 agent 推荐使用</li>
            <li>· `-thinking` / `-high` / `-low` / `-max` 变体与主模型同价,差异在思考预算上限</li>
            <li>· 动态计费(部分 GPT)按上下文长度分档,详见模型卡详情</li>
            <li>· 实际扣费以模型、分组(default / vip)和缓存命中情况为准</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
