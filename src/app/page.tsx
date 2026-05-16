import { ArrowRight, Boxes, Gauge, Plug, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SPECS = [
  {
    icon: Boxes,
    label: "MODELS",
    value: "40+",
    desc: "OpenAI / Claude / Gemini / DeepSeek / Qwen",
  },
  {
    icon: Plug,
    label: "PROTOCOL",
    value: "OpenAI 兼容",
    desc: "改 base_url 即可迁移,SDK 全兼容",
  },
  {
    icon: Gauge,
    label: "LATENCY",
    value: "< 80ms",
    desc: "国内直连,首字平均延迟",
  },
  {
    icon: ShieldCheck,
    label: "UPTIME",
    value: "99.9%",
    desc: "故障自动切换,稳定可用",
  },
];

const FAQ = [
  {
    q: "Zhongzhuan Token 是什么?",
    a: "Zhongzhuan Token 是一个面向开发者的 AI API 中转网关。你只需要一个 API Key,就能调用 OpenAI、Claude、Gemini、DeepSeek、Qwen 等 40+ 主流大模型,按 token 用量结算。",
  },
  {
    q: "和直接调用 OpenAI / Claude 官方有什么区别?",
    a: "1) 一个 Key 接入多家模型,无需分别注册账号、绑卡;2) 支持人民币充值;3) 国内网络直连,延迟更低;4) 完整 OpenAI 兼容协议,现有代码改 base_url 即可。",
  },
  {
    q: "API 协议和 OpenAI 一样吗?",
    a: "是。所有模型都暴露为 OpenAI Chat Completions 兼容接口。无论你用的是 openai-python、Vercel AI SDK、LangChain 还是其他客户端,只需要把 base_url 改成 https://zhongzhuantoken.com/v1 即可。",
  },
  {
    q: "如何计费?有最低充值门槛吗?",
    a: "按实际 token 用量结算,价格随官方定价同步调整,部分模型有额外折扣。最低充值 ¥10 起,余额不过期,不强制订阅。",
  },
  {
    q: "我的 API Key 和数据安全吗?",
    a: "Key 仅用于鉴权,可随时在控制台吊销和重置。请求转发不做训练数据收集,具体可参考服务条款。建议生产环境使用环境变量管理 Key。",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 border border-border bg-secondary/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
            </span>
            STATUS · OPERATIONAL
          </div>

          <h1 className="font-mono text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            一个 <span className="text-brand">API Key</span>,
            <br />
            接入全球大模型。
          </h1>

          <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
            Zhongzhuan Token 把 OpenAI、Claude、Gemini、DeepSeek、Qwen 等 40+
            模型统一封装成 OpenAI 兼容接口。改一行 base_url,即刻接入。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button size="lg" className="font-mono">
              开始使用
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" className="font-mono">
              查看文档
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
            {SPECS.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="flex flex-col gap-2 bg-background p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {spec.label}
                    </span>
                    <Icon className="size-4 text-brand" />
                  </div>
                  <div className="font-mono text-2xl font-semibold tracking-tight">
                    {spec.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {spec.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-brand">
            FAQ · 常见问题
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            还有疑问?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            没在下面找到答案,直接在控制台联系我们,工作日 30 分钟内回复。
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
