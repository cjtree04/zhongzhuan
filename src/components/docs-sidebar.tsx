"use client";

import { useEffect, useState } from "react";

const TOC = [
  { id: "intro", label: "接入概览", section: "OVERVIEW" },
  { id: "part1", label: "Part 01 · 网站使用文档", section: "PART 01" },
  { id: "part2", label: "Part 02 · Agent 接入", section: "PART 02" },
  { id: "claude-code", label: "Claude Code", indent: true },
  { id: "codex", label: "Codex (OpenAI)", indent: true },
  { id: "openclaw", label: "OpenClaw", indent: true },
  { id: "hermes", label: "Hermes", indent: true },
  { id: "sdk", label: "SDK 直调", section: "SDK" },
  { id: "troubleshoot", label: "常见问题", section: "DEBUG" },
];

export function DocsSidebar() {
  const [active, setActive] = useState<string>("intro");

  useEffect(() => {
    const handler = () => {
      let current = "intro";
      for (const item of TOC) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = item.id;
      }
      setActive(current);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <nav className="space-y-1 border-l border-border lg:border-l-0">
        {TOC.map((item) => {
          const isActive = active === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`block border-l-2 py-1.5 pl-4 font-mono text-xs transition-colors ${
                isActive
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              } ${item.indent ? "pl-8 text-[11px]" : ""}`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
