import { CodeBlock } from "@/components/code-block";
import { DocsSidebar } from "@/components/docs-sidebar";

export const metadata = {
  title: "接入文档 — Zhongzhuan Token",
  description: "Claude Code / Codex / OpenClaw / Hermes 等主流 agent 一键接入指南,SDK 直调示例。",
};

const BASE = "https://zhongzhuantoken.com";

export default function DocsPage() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[220px_1fr] lg:py-16">
        <DocsSidebar />

        <article className="min-w-0 space-y-16">
          {/* ───────────── Intro ───────────── */}
          <Section id="intro" title="接入概览" eyebrow="INTRO">
            <p>
              Zhongzhuan Token 通过统一的 OpenAI 兼容协议 + Anthropic 原生协议
              双通道,将 Claude 与 GPT-5 全系模型暴露在同一域名下。下面这两个
              base_url 覆盖了所有客户端需要的接入方式:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Endpoint label="OpenAI 兼容(Codex / openai SDK)" url={`${BASE}/v1`} />
              <Endpoint label="Anthropic 原生(Claude Code / anthropic SDK)" url={BASE} note="末尾不带 /v1,SDK 自己会补" />
            </div>
            <p>
              <strong>API Key</strong> 请先在控制台「
              <a href={`${BASE}/token`} className="text-brand underline-offset-2 hover:underline">
                令牌管理
              </a>
              」生成。下文示例中所有的 <Inline>YOUR_KEY</Inline> 替换为你自己的 Key 即可。
            </p>
          </Section>

          {/* ───────────── Part 1 ───────────── */}
          <Section id="part1" title="第一部分 · 网站使用文档" eyebrow="PART 01">
            <Placeholder>
              这一部分将随网站功能(注册、充值、令牌、监控、邀请)逐步上线,目前留位待补。
              先用第二部分的 Agent 配置指南即可开始接入。
            </Placeholder>
          </Section>

          {/* ───────────── Part 2 ───────────── */}
          <Section id="part2" title="第二部分 · Agent 接入配置" eyebrow="PART 02">
            <p>
              下面所有 agent 都用同一个 <Inline>YOUR_KEY</Inline> 即可。
              本站统一使用 <Inline>{BASE}</Inline> 作为根域名,
              不同 agent 对路径前缀的预期不同(部分自动补 <Inline>/v1</Inline>,
              部分需要你显式写),按下方示例直接复制即可。
            </p>
          </Section>

          {/* ───────────── Claude Code ───────────── */}
          <Section id="claude-code" title="Claude Code" eyebrow="AGENT · 01">
            <p>
              Anthropic 官方 CLI,默认走 Anthropic 原生协议。把 base_url
              指向本站即可,模型名直接用 <Inline>claude-opus-4-7</Inline> 等。
            </p>

            <Step n={1} title="安装(若已安装跳过)" />
            <CodeBlock
              lang="bash"
              code={`# macOS / Linux
sudo npm install -g @anthropic-ai/claude-code

# Windows (PowerShell 管理员)
npm install -g @anthropic-ai/claude-code

# 验证
claude --version`}
            />

            <Step n={2} title="配置环境变量" />
            <CodeBlock
              lang="bash"
              code={`# macOS / Linux,加入 ~/.zshrc 或 ~/.bashrc
export ANTHROPIC_BASE_URL="${BASE}"
export ANTHROPIC_AUTH_TOKEN="YOUR_KEY"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
# 加载
source ~/.zshrc`}
            />
            <CodeBlock
              lang="powershell"
              code={`# Windows PowerShell(永久写入用户环境变量)
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "${BASE}", "User")
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "YOUR_KEY", "User")
[System.Environment]::SetEnvironmentVariable("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1", "User")
# 关掉当前终端,重开 PowerShell 让变量生效`}
            />

            <Step n={3} title="开始使用" />
            <CodeBlock
              lang="bash"
              code={`cd your-project
claude
# 进入交互式 REPL,直接对话`}
            />
          </Section>

          {/* ───────────── Codex ───────────── */}
          <Section id="codex" title="Codex (OpenAI)" eyebrow="AGENT · 02">
            <p>
              OpenAI 官方 CLI,走 OpenAI Chat Completions 协议。base_url
              要带 <Inline>/v1</Inline>,模型名用 <Inline>gpt-5.5</Inline> 等。
            </p>

            <Step n={1} title="安装" />
            <CodeBlock
              lang="bash"
              code={`# macOS / Linux
sudo npm install -g @openai/codex@latest

# Windows
npm install -g @openai/codex@latest

# 验证
codex --version`}
            />

            <Step n={2} title="创建 config.toml" />
            <CodeBlock
              lang="bash"
              code={`# 重置配置目录
rm -rf ~/.codex && mkdir -p ~/.codex

# 写入配置
cat > ~/.codex/config.toml << 'EOF'
model_provider = "OpenAI"
model = "gpt-5.5"
review_model = "gpt-5.5"
model_reasoning_effort = "medium"

[model_providers.OpenAI]
name = "Zhongzhuan Token"
base_url = "${BASE}/v1"
wire_api = "responses"
env_key = "OPENAI_API_KEY"
EOF

# 设置 API Key
export OPENAI_API_KEY="YOUR_KEY"
echo 'export OPENAI_API_KEY="YOUR_KEY"' >> ~/.zshrc`}
            />

            <Step n={3} title="开始使用" />
            <CodeBlock lang="bash" code={`codex\n# 进入 Codex 交互模式`} />
          </Section>

          {/* ───────────── OpenClaw ───────────── */}
          <Section id="openclaw" title="OpenClaw" eyebrow="AGENT · 03">
            <p>
              开源双协议 agent,同一个客户端可以在 Anthropic 通道和 OpenAI 通道间切换。
              本站两个通道分别如下:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm">
              <li>
                Anthropic(Claude)通道 base_url:<Inline>{BASE}</Inline>
                <span className="ml-1 text-muted-foreground">— 不带 /v1,示例模型 <Inline>claude-opus-4-7</Inline></span>
              </li>
              <li>
                OpenAI(Codex)通道 base_url:<Inline>{BASE}/v1</Inline>
                <span className="ml-1 text-muted-foreground">— 必须带 /v1,示例模型 <Inline>gpt-5.5</Inline></span>
              </li>
            </ul>

            <Step n={1} title="一键安装(交互式选择通道)" />
            <CodeBlock
              lang="bash"
              code={`curl -fsSL https://apikey.fun/install/openclaw.sh | sudo bash
# 脚本会提示选择通道(Anthropic / OpenAI)和粘贴 API Key`}
            />

            <Step n={2} title="手动配置(可选)" />
            <CodeBlock
              lang="bash"
              code={`# Anthropic 通道
export ANTHROPIC_BASE_URL="${BASE}"
export ANTHROPIC_API_KEY="YOUR_KEY"
openclaw --provider anthropic --model claude-opus-4-7

# OpenAI 通道
export OPENAI_BASE_URL="${BASE}/v1"
export OPENAI_API_KEY="YOUR_KEY"
openclaw --provider openai --model gpt-5.5`}
            />
          </Section>

          {/* ───────────── Hermes ───────────── */}
          <Section id="hermes" title="Hermes" eyebrow="AGENT · 04">
            <p>
              轻量级编程 agent,默认走 OpenAI 兼容协议,也支持切换 Anthropic
              通道。一键脚本会引导你完成配置。
            </p>

            <Step n={1} title="一键安装" />
            <CodeBlock
              lang="bash"
              code={`# macOS / Linux
curl -fsSL https://apikey.fun/install/hermes.sh | sudo bash

# Windows PowerShell
irm https://apikey.fun/install/hermes.ps1 | iex`}
            />

            <Step n={2} title="手动配置" />
            <CodeBlock
              lang="bash"
              code={`# 写入 ~/.hermes/config.yaml
mkdir -p ~/.hermes
cat > ~/.hermes/config.yaml << 'EOF'
provider: openai
base_url: ${BASE}/v1
api_key: YOUR_KEY
model: gpt-5.5
EOF

# 启动
hermes`}
            />
          </Section>

          {/* ───────────── SDK 直调 ───────────── */}
          <Section id="sdk" title="SDK 直调" eyebrow="SDK">
            <p>
              如果你在自己写 agent 或集成到现有项目,直接用官方 SDK 改 base_url
              即可。下面三种最常见。
            </p>

            <Step n={1} title="Node.js · openai 包(GPT / Claude 共用)" />
            <CodeBlock
              lang="ts"
              code={`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "${BASE}/v1",
});

const res = await client.chat.completions.create({
  model: "gpt-5.5",                  // 或 "claude-opus-4-7"
  messages: [{ role: "user", content: "你好" }],
});
console.log(res.choices[0].message.content);`}
            />

            <Step n={2} title="Python · openai 包" />
            <CodeBlock
              lang="python"
              code={`from openai import OpenAI

client = OpenAI(
    api_key="YOUR_KEY",
    base_url="${BASE}/v1",
)

res = client.chat.completions.create(
    model="gpt-5.5",                 # 或 "claude-opus-4-7"
    messages=[{"role": "user", "content": "你好"}],
)
print(res.choices[0].message.content)`}
            />

            <Step n={3} title="Node.js · @anthropic-ai/sdk(走原生 Anthropic 协议)" />
            <CodeBlock
              lang="ts"
              code={`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "${BASE}",      // 注意不带 /v1
});

const msg = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: [{ role: "user", content: "你好" }],
});
console.log(msg.content);`}
            />

            <Step n={4} title="cURL · 快速测试" />
            <CodeBlock
              lang="bash"
              code={`# OpenAI 协议
curl ${BASE}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-5.5","messages":[{"role":"user","content":"hi"}]}'

# Anthropic 协议
curl ${BASE}/v1/messages \\
  -H "x-api-key: YOUR_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"claude-opus-4-7","max_tokens":1024,"messages":[{"role":"user","content":"hi"}]}'`}
            />
          </Section>

          {/* ───────────── Troubleshooting ───────────── */}
          <Section id="troubleshoot" title="常见问题" eyebrow="TROUBLESHOOT">
            <Faq q="返回 401 / Invalid token">
              检查 API Key 是否复制完整、是否被环境变量覆盖。控制台「令牌管理」可重新生成。
            </Faq>
            <Faq q="返回 404 / Endpoint not found">
              确认 base_url 是否带 <Inline>/v1</Inline>。OpenAI 协议要带,Anthropic 原生协议不带。
            </Faq>
            <Faq q="返回 429 / Rate limit">
              切到 vip 分组,或联系客服调整速率上限。
            </Faq>
            <Faq q="Claude Code 黄字警告 / 异常退出">
              确认设置了 <Inline>CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1</Inline>,
              否则会向 anthropic.com 发遥测请求被中转拒绝。
            </Faq>
          </Section>
        </article>
      </div>
    </div>
  );
}

// ───────────── Building blocks ─────────────

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-5">
      <div>
        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
          {eyebrow}
        </div>
        <h2 className="font-mono text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      <div className="space-y-4 text-sm leading-relaxed text-foreground md:text-[15px]">
        {children}
      </div>
    </section>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="inline-flex size-6 items-center justify-center border border-brand/40 bg-brand/10 font-mono text-xs text-brand">
        {n}
      </span>
      <h3 className="font-mono text-sm font-semibold tracking-wide text-foreground">
        {title}
      </h3>
    </div>
  );
}

function Endpoint({ label, url, note }: { label: string; url: string; note?: string }) {
  return (
    <div className="border border-border bg-secondary/40 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-medium text-brand break-all">
        {url}
      </div>
      {note ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
      ) : null}
    </div>
  );
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-border bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-foreground">
      {children}
    </code>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border bg-secondary/30 p-6 font-mono text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-border pl-4">
      <div className="font-mono text-sm font-semibold text-foreground">{q}</div>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
