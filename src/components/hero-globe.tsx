"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";

import Claude from "@lobehub/icons/es/Claude";
import DeepSeek from "@lobehub/icons/es/DeepSeek";
import Doubao from "@lobehub/icons/es/Doubao";
import Gemini from "@lobehub/icons/es/Gemini";
import Grok from "@lobehub/icons/es/Grok";
import Kimi from "@lobehub/icons/es/Kimi";
import Meta from "@lobehub/icons/es/Meta";
import Mistral from "@lobehub/icons/es/Mistral";
import OpenAI from "@lobehub/icons/es/OpenAI";
import Perplexity from "@lobehub/icons/es/Perplexity";
import Qwen from "@lobehub/icons/es/Qwen";
import Zhipu from "@lobehub/icons/es/Zhipu";

import { cn } from "@/lib/utils";

// lobehub 每家 logo 的 CompoundedIcon 类型互不兼容，这里用通用 component 类型
// 兜底 (size / className / style 都是字符串/数字，够用)。
type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}>;

const R = 200; // globe radius in viewBox units
const CENTER = 300; // viewBox center (canvas is 600x600)
const LOGO_SIZE = 52;
const LAT_LINES = [-60, -30, 0, 30, 60];
const LNG_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];

const INITIAL_ROT_X = 0.35;
const INITIAL_ROT_Y = -0.6;
const RETURN_DELAY_MS = 800; // wait after pointer leave before returning
const RETURN_DURATION_MS = 700;
const AUTOSPIN_SPEED = 0.12; // rad/sec

type LogoEntry = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  Mono: IconComponent;
  // null = no brand-color variant in lobehub → hover falls back to Mono in `text-foreground`
  // which adapts to light/dark automatically.
  Color: IconComponent | null;
};

const LOGOS: LogoEntry[] = [
  // Claude and OpenAI clustered around the default-view center (lng ≈ +34°)
  { id: "claude", name: "Claude", lat: 35, lng: 20, Mono: Claude, Color: Claude.Color },
  { id: "openai", name: "OpenAI", lat: 28, lng: 38, Mono: OpenAI, Color: null },
  // Front hemisphere spread
  { id: "gemini", name: "Gemini", lat: 52, lng: -10, Mono: Gemini, Color: Gemini.Color },
  { id: "mistral", name: "Mistral", lat: 50, lng: 75, Mono: Mistral, Color: Mistral.Color },
  { id: "perplexity", name: "Perplexity", lat: 15, lng: -25, Mono: Perplexity, Color: Perplexity.Color },
  { id: "meta", name: "Meta", lat: -15, lng: 5, Mono: Meta, Color: Meta.Color },
  { id: "deepseek", name: "DeepSeek", lat: 5, lng: 110, Mono: DeepSeek, Color: DeepSeek.Color },
  { id: "doubao", name: "Doubao", lat: -35, lng: 60, Mono: Doubao, Color: Doubao.Color },
  // Back hemisphere (rotate to find)
  { id: "kimi", name: "Kimi", lat: -25, lng: 145, Mono: Kimi, Color: Kimi.Color },
  { id: "zhipu", name: "Zhipu", lat: 45, lng: 165, Mono: Zhipu, Color: Zhipu.Color },
  { id: "grok", name: "Grok", lat: -5, lng: -90, Mono: Grok, Color: null },
  { id: "qwen", name: "Qwen", lat: -45, lng: -160, Mono: Qwen, Color: Qwen.Color },
];

type Vec3 = { x: number; y: number; z: number };
type Phase = "idle" | "interacting" | "wait" | "returning";

function project(lat: number, lng: number, rotX: number, rotY: number, r: number): Vec3 {
  const phi = (lat * Math.PI) / 180;
  const lam = (lng * Math.PI) / 180;
  let x = r * Math.cos(phi) * Math.sin(lam);
  let y = r * Math.sin(phi);
  let z = r * Math.cos(phi) * Math.cos(lam);
  const cY = Math.cos(rotY);
  const sY = Math.sin(rotY);
  const x1 = x * cY + z * sY;
  const z1 = -x * sY + z * cY;
  x = x1;
  z = z1;
  const cX = Math.cos(rotX);
  const sX = Math.sin(rotX);
  const y1 = y * cX - z * sX;
  const z2 = y * sX + z * cX;
  y = y1;
  z = z2;
  return { x, y, z };
}

function buildLine(samples: Vec3[]): { front: string; back: string } {
  const front: string[] = [];
  const back: string[] = [];
  let cur: string[] | null = null;
  let curFront = true;
  const flush = () => {
    if (cur && cur.length > 1) (curFront ? front : back).push(cur.join(" "));
    cur = null;
  };
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    const isFront = p.z >= 0;
    if (cur === null || isFront !== curFront) {
      if (i > 0 && cur !== null) {
        const prev = samples[i - 1];
        const t = prev.z / (prev.z - p.z);
        const ix = prev.x + (p.x - prev.x) * t;
        const iy = prev.y + (p.y - prev.y) * t;
        cur.push(`L ${(CENTER + ix).toFixed(2)} ${(CENTER - iy).toFixed(2)}`);
        flush();
        cur = [`M ${(CENTER + ix).toFixed(2)} ${(CENTER - iy).toFixed(2)}`];
      } else {
        cur = [`M ${(CENTER + p.x).toFixed(2)} ${(CENTER - p.y).toFixed(2)}`];
      }
      curFront = isFront;
    }
    cur.push(`L ${(CENTER + p.x).toFixed(2)} ${(CENTER - p.y).toFixed(2)}`);
  }
  flush();
  return { front: front.join(" "), back: back.join(" ") };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function HeroGlobe() {
  const [rotX, setRotX] = useState(INITIAL_ROT_X);
  const [rotY, setRotY] = useState(INITIAL_ROT_Y);
  const [hovering, setHovering] = useState(false);

  // refs that mirror latest state for use inside callbacks
  const rotXRef = useRef(rotX);
  const rotYRef = useRef(rotY);
  useEffect(() => {
    rotXRef.current = rotX;
  }, [rotX]);
  useEffect(() => {
    rotYRef.current = rotY;
  }, [rotY]);

  const phaseRef = useRef<Phase>("idle");
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const waitTimerRef = useRef<number | null>(null);
  const returnDataRef = useRef<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    startTime: number;
  } | null>(null);

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const phase = phaseRef.current;
      if (phase === "idle") {
        setRotY((y) => y + dt * AUTOSPIN_SPEED);
      } else if (phase === "returning" && returnDataRef.current) {
        const d = returnDataRef.current;
        const t = Math.min(1, (now - d.startTime) / RETURN_DURATION_MS);
        const e = easeOutCubic(t);
        setRotX(d.startX + (d.targetX - d.startX) * e);
        setRotY(d.startY + (d.targetY - d.startY) * e);
        if (t >= 1) {
          phaseRef.current = "idle";
          returnDataRef.current = null;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current);
      }
    };
  }, []);

  const clearWaitTimer = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  const beginReturn = () => {
    const startX = rotXRef.current;
    const startY = rotYRef.current;
    // pick the nearest equivalent of INITIAL_ROT_Y modulo 2π so we don't unwind whole rotations
    const k = Math.round((startY - INITIAL_ROT_Y) / (Math.PI * 2));
    const targetY = INITIAL_ROT_Y + k * Math.PI * 2;
    returnDataRef.current = {
      startX,
      startY,
      targetX: INITIAL_ROT_X,
      targetY,
      startTime: performance.now(),
    };
    phaseRef.current = "returning";
  };

  const onPointerEnter = () => {
    clearWaitTimer();
    phaseRef.current = "interacting";
    setHovering(true);
  };

  const onPointerLeave = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    setHovering(false);
    phaseRef.current = "wait";
    clearWaitTimer();
    waitTimerRef.current = window.setTimeout(() => {
      waitTimerRef.current = null;
      // only begin return if we're still waiting (user didn't come back)
      if (phaseRef.current === "wait") beginReturn();
    }, RETURN_DELAY_MS);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = true;
    clearWaitTimer();
    phaseRef.current = "interacting";
    returnDataRef.current = null;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setRotY((y) => y + dx * 0.006);
    setRotX((x) => Math.max(-1.3, Math.min(1.3, x + dy * 0.006)));
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Precompute geometry for current rotation
  const meridians = useMemo(() => {
    return LNG_LINES.map((lng) => {
      const pts: Vec3[] = [];
      for (let lat = -90; lat <= 90; lat += 4) {
        pts.push(project(lat, lng, rotX, rotY, R));
      }
      return { id: `lng-${lng}`, ...buildLine(pts) };
    });
  }, [rotX, rotY]);

  const latitudes = useMemo(() => {
    return LAT_LINES.map((lat) => {
      const pts: Vec3[] = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        pts.push(project(lat, lng, rotX, rotY, R));
      }
      return { id: `lat-${lat}`, ...buildLine(pts) };
    });
  }, [rotX, rotY]);

  const projectedLogos = useMemo(() => {
    return LOGOS.map((logo) => {
      const p = project(logo.lat, logo.lng, rotX, rotY, R);
      return { ...logo, ...p };
    }).sort((a, b) => a.z - b.z);
  }, [rotX, rotY]);

  return (
    <div className="relative aspect-square w-full max-w-[560px] text-foreground">
      <CornerBrackets />

      <div
        className={cn(
          "absolute inset-0 transition-transform duration-300 ease-out will-change-transform",
          hovering && "scale-[1.04] -translate-y-1",
        )}
      >
        <svg
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
          className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          role="img"
          aria-label="可旋转的全球 LLM 路由地球仪"
        >
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
            </pattern>
            <radialGradient id="globeShade" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.02" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.04" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.10" />
            </radialGradient>
            <clipPath id="globeClip">
              <circle cx={CENTER} cy={CENTER} r={R} />
            </clipPath>
          </defs>

          <rect width="600" height="600" fill="url(#grid)" />

          {/* Outer horizon ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="url(#globeShade)"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          {/* Wireframe — back hemisphere (faint) */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 3"
            clipPath="url(#globeClip)"
          >
            {meridians.map((m) => (
              <path key={`bm-${m.id}`} d={m.back} opacity="0.10" />
            ))}
            {latitudes.map((l) => (
              <path key={`bl-${l.id}`} d={l.back} opacity="0.10" />
            ))}
          </g>

          {/* Wireframe — front hemisphere */}
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="2 3"
            clipPath="url(#globeClip)"
          >
            {meridians.map((m) => (
              <path key={`fm-${m.id}`} d={m.front} opacity="0.28" />
            ))}
            {latitudes.map((l) => (
              <path key={`fl-${l.id}`} d={l.front} opacity="0.28" />
            ))}
          </g>

          {/* Logos */}
          {projectedLogos.map((logo) => {
            const visible = logo.z > -R * 0.15;
            if (!visible) return null;
            const cx = CENTER + logo.x;
            const cy = CENTER - logo.y;
            const isFront = logo.z >= 0;
            const opacity = isFront ? 1 : 0.25;
            const scale = 0.65 + 0.35 * Math.max(0, logo.z / R);
            return (
              <foreignObject
                key={logo.id}
                x={cx - LOGO_SIZE / 2}
                y={cy - LOGO_SIZE / 2}
                width={LOGO_SIZE}
                height={LOGO_SIZE}
                style={{ overflow: "visible", opacity }}
              >
                <LogoChip logo={logo} scale={scale} interactive={isFront} />
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function LogoChip({
  logo,
  scale,
  interactive,
}: {
  logo: LogoEntry;
  scale: number;
  interactive: boolean;
}) {
  const { Mono, Color, name } = logo;
  const iconSize = LOGO_SIZE - 10;
  return (
    <div
      className={cn(
        "group/logo relative flex items-center justify-center",
        interactive ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        transform: `scale(${scale.toFixed(3)})`,
        transformOrigin: "center",
      }}
    >
      <Mono
        size={iconSize}
        className="absolute text-muted-foreground/70 transition-all duration-200 group-hover/logo:opacity-0 group-hover/logo:scale-90"
      />
      {Color ? (
        <Color
          size={iconSize}
          className="absolute opacity-0 transition-all duration-200 group-hover/logo:opacity-100 group-hover/logo:scale-110"
        />
      ) : (
        // No brand-color variant in lobehub (OpenAI / Grok) — use Mono in
        // foreground color so it stays readable in both light and dark mode.
        <Mono
          size={iconSize}
          className="absolute text-foreground opacity-0 transition-all duration-200 group-hover/logo:opacity-100 group-hover/logo:scale-110"
        />
      )}
      <div className="pointer-events-none absolute top-full mt-2 origin-top scale-90 whitespace-nowrap rounded-sm border border-border bg-background/95 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground opacity-0 backdrop-blur transition-all duration-200 group-hover/logo:scale-100 group-hover/logo:opacity-100">
        {name}
      </div>
    </div>
  );
}

function CornerBrackets() {
  const arms = "h-4 w-4 border-border";
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className={`absolute left-0 top-0 ${arms} border-l border-t`} />
      <div className={`absolute right-0 top-0 ${arms} border-r border-t`} />
      <div className={`absolute bottom-0 left-0 ${arms} border-b border-l`} />
      <div className={`absolute bottom-0 right-0 ${arms} border-b border-r`} />
    </div>
  );
}
