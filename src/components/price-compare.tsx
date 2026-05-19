import Link from "next/link";
import { ArrowRight, Boxes, Infinity as InfinityIcon, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GROUP_RATIO,
  TOPUP_RATE,
  USD_TO_CNY,
  savingsPercentFor,
} from "@/lib/pricing";

export function PriceCompare() {
  // GPT/Gemini 节省最猛(1x 倍率),用它做大头条
  const headlineSavings = savingsPercentFor("gpt");
  const claudeSavings = savingsPercentFor("claude");

  return (
    <section id="pricing" className="scroll-mt-20 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand">
            PRICING · 价格优势
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-5xl">
            一次充值，按量扣费
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            没有订阅，没有阶梯，没有套餐。充多少用多少，余额永不过期。
          </p>
        </div>

        {/* Hero rate */}
        <div className="mb-12 border border-border bg-secondary/30 px-6 py-12 md:px-12 md:py-16">
          <div className="flex flex-col items-center text-center">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              充值汇率
            </div>
            <div className="mt-4 flex flex-wrap items-baseline justify-center gap-3 font-mono md:gap-5">
              <span className="text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
                ¥{TOPUP_RATE}
              </span>
              <span className="text-3xl text-muted-foreground md:text-5xl">=</span>
              <span className="text-5xl font-semibold tracking-tight text-brand md:text-7xl">
                $1
              </span>
            </div>
            <div className="mt-4 font-mono text-sm text-muted-foreground md:text-base">
              充值 <span className="text-foreground">¥40</span> 即得 <span className="text-foreground">$100</span> 美元额度
            </div>
            <div className="mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground md:text-sm">
              按厂商官方价扣额度，实际成本相比直接走官方({" "}
              <span className="font-mono">¥{USD_TO_CNY}/$1</span>
              {" "}市场汇率)节省高达{" "}
              <span className="font-mono font-semibold text-brand">{headlineSavings}%</span>。
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mb-12 grid gap-4 md:grid-cols-3 md:gap-5">
          <FeatureCard
            icon={<Boxes className="size-5" />}
            title="官方原生模型"
            desc={
              <>
                Claude opus 4.7 · GPT-5.5 · Gemini 3 Pro
                <br />
                与 thinkai 同步 20+ 主流模型
              </>
            }
          />
          <FeatureCard
            icon={<TrendingDown className="size-5" />}
            title={`节省 ${headlineSavings}%`}
            desc={
              <>
                对比厂商官方价(按 ¥{USD_TO_CNY}/$1 折算)
                <br />
                Claude 系列节省 {claudeSavings}%,GPT/Gemini 节省 {headlineSavings}%
              </>
            }
          />
          <FeatureCard
            icon={<InfinityIcon className="size-5" />}
            title="永不过期"
            desc={
              <>
                按量扣费，余额不限期使用
                <br />
                没有订阅锁定，没有最低消费
              </>
            }
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
          <Button
            size="lg"
            nativeButton={false}
            className="w-full font-mono md:w-auto"
            render={
              <Link href="/pricing">
                查看完整价格表
                <ArrowRight />
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            className="w-full font-mono md:w-auto"
            render={<Link href="/register">立即注册 · 开始使用</Link>}
          />
        </div>

        {/* Small claude ratio footnote (用户原始需求要求标注，但不能显眼) */}
        <div className="mt-10 text-center font-mono text-[10px] text-muted-foreground/60">
          * Claude 系列倍率 {GROUP_RATIO.claude}×,详见{" "}
          <Link href="/pricing" className="underline-offset-2 hover:underline hover:text-brand">
            完整价格表
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="group border border-border bg-background p-6 transition-colors hover:border-brand/40 hover:bg-secondary/30">
      <div className="mb-3 inline-flex size-10 items-center justify-center border border-border bg-secondary/50 text-brand transition-colors group-hover:border-brand/40 group-hover:bg-brand/10">
        {icon}
      </div>
      <h3 className="font-mono text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
        {desc}
      </p>
    </div>
  );
}
