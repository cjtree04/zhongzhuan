import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Zhongzhuan Token — Claude / GPT-5 / Gemini 中转 API",
  description:
    "国内直连 Claude 全系 / GPT-5 全系 / Gemini 全系 20+ 模型。¥0.42 = $1 美元额度，按官方价扣费，按量付费余额永不过期。新用户加客服微信领 $20。",
};

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FeatureGrid } from "@/components/feature-grid";
import { HeroGlobe } from "@/components/hero-globe";
import { PriceCompare } from "@/components/price-compare";

const FAQ = [
  {
    q: "Zhongzhuan Token 是什么?",
    a: "Zhongzhuan Token 是一个面向开发者的海外大模型 API 中转网关。你只需要一个 API Key，就能调用 Claude、GPT-5 等海外最先进的大模型，按 token 用量结算，国内直连。",
  },
  {
    q: "和直接调用 Claude / OpenAI 官方有什么区别?",
    a: "1) 一个 Key 同时调两家，无需分别注册账号、绑外币卡；2) 国内多线路直连，延迟更低；3) 不踩区域封号雷；4) 完整 OpenAI 兼容协议 + Anthropic 原生协议双通道，现有代码改一行 base_url 即可。",
  },
  {
    q: "支持哪些客户端 / Agent?",
    a: "Claude Code、Codex CLI、OpenClaw、Hermes 这些主流 agent 都给了一键脚本和环境变量配置，SDK 层面 openai-python / openai-node / @anthropic-ai/sdk 全兼容。详见 /docs。",
  },
  {
    q: "如何计费?有最低充值门槛吗?",
    a: "按实际 token 用量结算，人民币充值，余额不过期，不强制订阅。最低 ¥10 起，缓存读取价独立按更低单价计算。",
  },
  {
    q: "稳定性如何?出问题怎么联系?",
    a: "多上游冗余 + 自动故障切换，SLA 99.9% 月度可用率。7×24 在线客服，工作日 30 分钟、夜间 2 小时内人工响应。",
  },
  {
    q: "我的 API Key 和数据安全吗?",
    a: "Key 仅用于鉴权，可随时在控制台吊销和重置。请求转发不做训练数据收集，不缓存用户请求体。建议生产环境使用环境变量管理 Key。",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── 第一页 · Hero ─── */}
      <section className="relative border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-border bg-secondary/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
              </span>
              STATUS · OPERATIONAL
            </div>

            <h1 className="font-mono text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-[56px]">
              用<span className="text-brand">中转 token</span>，
              <br />
              就上 zhongzhuantoken.com
            </h1>

            <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
              一个 api key 接入海外最先进的大模型，国内直连，支持人民币结算。
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                className="font-mono group"
                render={
                  <Link href="/register">
                    立即开始
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                className="font-mono"
                render={<Link href="/docs">查看文档</Link>}
              />
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <HeroGlobe />
          </div>
        </div>
      </section>

      {/* ─── 第二页 · 核心卖点 ─── */}
      <FeatureGrid />

      {/* ─── 第三页 · 简略价格对比 ─── */}
      <PriceCompare />

      {/* ─── 第四页 · FAQ ─── */}
      <section id="faq" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-brand">
            FAQ · 常见问题
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            还有疑问?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            没在下面找到答案，在控制台联系客服，工作日 30 分钟内回复。
          </p>

          <Accordion className="mt-10 border-y border-border">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="font-mono text-base text-foreground">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
