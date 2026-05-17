import { Gauge, Headset, Plug, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Gauge,
    metric: "50ms",
    title: "低延迟",
    desc: "国内多线路直连，首字平均响应 50ms，长上下文推理同步流式。",
  },
  {
    icon: ShieldCheck,
    metric: "99.9%",
    title: "稳定可用",
    desc: "多上游冗余 + 自动故障切换，SLA 99.9% 月度可用率。",
  },
  {
    icon: Headset,
    metric: "7×24",
    title: "在线客服",
    desc: "工作日 30 分钟、夜间 2 小时内人工响应，封号/账单/接入问题随时解决。",
  },
  {
    icon: Plug,
    metric: "1 line",
    title: "OpenAI 兼容协议",
    desc: "改一行 base_url 即接入。Claude / GPT 共用同一套 SDK，无需改业务代码。",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-b border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand">
            CORE · 核心卖点
          </div>
          <h2 className="font-mono text-3xl font-semibold tracking-tight md:text-4xl">
            为什么选 Zhongzhuan Token?
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            把"中转站"做成基础设施 — 低延迟、稳定、服务到位，接入零门槛。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group flex flex-col gap-4 bg-background p-6 transition-colors hover:bg-secondary/50 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-5 text-brand transition-transform group-hover:-translate-y-0.5" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    /{String(FEATURES.indexOf(f) + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="font-mono text-3xl font-semibold tracking-tight text-brand md:text-4xl">
                  {f.metric}
                </div>
                <div>
                  <div className="font-mono text-sm font-semibold tracking-wide text-foreground">
                    {f.title}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
