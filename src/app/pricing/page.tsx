import { PricingExplorer } from "@/components/pricing-explorer";
import { USD_TO_CNY_RATE } from "@/lib/pricing";

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
            等变体。价格单位 $ 直接对应人民币(<span className="font-mono text-foreground">$1 ≈ ¥1</span>),
            节省比例按 1 USD ≈ ¥{USD_TO_CNY_RATE} 折算后对比官方真实人民币成本。
          </p>
        </div>

        <PricingExplorer />

        <div className="mt-12 border border-border bg-secondary/30 p-6 font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
          <div className="mb-2 font-semibold text-foreground">计价规则速查</div>
          <ul className="space-y-1.5">
            <li>· 显示价格的 $ 等于 ¥,按 1:1 从余额扣 RMB(不存在汇率波动)</li>
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
