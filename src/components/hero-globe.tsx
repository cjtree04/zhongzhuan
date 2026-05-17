"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Claude from "@lobehub/icons/es/Claude";
import DeepSeek from "@lobehub/icons/es/DeepSeek";
import Gemini from "@lobehub/icons/es/Gemini";
import Grok from "@lobehub/icons/es/Grok";
import OpenAI from "@lobehub/icons/es/OpenAI";
import Qwen from "@lobehub/icons/es/Qwen";

import { cn } from "@/lib/utils";

const R = 200; // globe radius in viewBox units
const CENTER = 300; // viewBox center (canvas is 600x600)
const LOGO_SIZE = 34;
const LAT_LINES = [-60, -30, 0, 30, 60];
const LNG_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];

type LogoEntry = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  Mono: typeof Claude;
  Color: typeof Claude.Color | null; // null = fallback to Mono tinted by `brand`
  brand: string;
};

const LOGOS: LogoEntry[] = [
  { id: "claude", name: "Claude", lat: 42, lng: -77, Mono: Claude, Color: Claude.Color, brand: "#D97757" },
  { id: "openai", name: "OpenAI", lat: 37, lng: -122, Mono: OpenAI, Color: null, brand: "#0F0F0F" },
  { id: "gemini", name: "Gemini", lat: 51, lng: -1, Mono: Gemini, Color: Gemini.Color, brand: "#4796E3" },
  { id: "grok", name: "Grok", lat: -10, lng: -45, Mono: Grok, Color: null, brand: "#0F0F0F" },
  { id: "deepseek", name: "DeepSeek", lat: 30, lng: 116, Mono: DeepSeek, Color: DeepSeek.Color, brand: "#4D6BFE" },
  { id: "qwen", name: "Qwen", lat: -33, lng: 151, Mono: Qwen, Color: Qwen.Color, brand: "#615CED" },
];

type Vec3 = { x: number; y: number; z: number };

function project(lat: number, lng: number, rotX: number, rotY: number, r: number): Vec3 {
  const phi = (lat * Math.PI) / 180;
  const lam = (lng * Math.PI) / 180;
  // initial sphere point (Y up, Z toward viewer at lng=0)
  let x = r * Math.cos(phi) * Math.sin(lam);
  let y = r * Math.sin(phi);
  let z = r * Math.cos(phi) * Math.cos(lam);
  // rotate around Y axis (horizontal drag)
  const cY = Math.cos(rotY);
  const sY = Math.sin(rotY);
  const x1 = x * cY + z * sY;
  const z1 = -x * sY + z * cY;
  x = x1;
  z = z1;
  // rotate around X axis (vertical drag)
  const cX = Math.cos(rotX);
  const sX = Math.sin(rotX);
  const y1 = y * cX - z * sX;
  const z2 = y * sX + z * cX;
  y = y1;
  z = z2;
  return { x, y, z };
}

/** Build SVG polyline path, splitting into front (z>=0) and back segments. */
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
      // boundary interpolation if we have a previous point
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

export function HeroGlobe() {
  const [rotX, setRotX] = useState(0.35);
  const [rotY, setRotY] = useState(-0.6);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const interactingRef = useRef(false); // hover or drag, pauses autospin

  // auto-spin while idle
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!interactingRef.current) {
        setRotY((y) => y + dt * 0.12);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = true;
    interactingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };
    setRotY((y) => y + dx * 0.006);
    setRotX((x) => Math.max(-1.3, Math.min(1.3, x + dy * 0.006)));
  };

  const stopDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Precompute meridians and latitudes for the current rotation
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
    }).sort((a, b) => a.z - b.z); // back-to-front render order
  }, [rotX, rotY]);

  return (
    <div className="relative aspect-square w-full max-w-[560px] text-foreground">
      {/* Corner brackets */}
      <CornerBrackets />

      {/* Top labels */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-1 bg-brand" />
        FIG.01 · GLOBAL ROUTING
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70">
        ZTKN · 2026.Q2
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
        DRAG TO ROTATE
      </div>

      <svg
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerEnter={() => {
          interactingRef.current = true;
        }}
        onPointerLeave={(e) => {
          interactingRef.current = false;
          stopDrag(e);
        }}
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
        <circle cx={CENTER} cy={CENTER} r={R} fill="url(#globeShade)" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />

        {/* Wireframe — back hemisphere first (faint) */}
        <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" clipPath="url(#globeClip)">
          {meridians.map((m) => (
            <path key={`bm-${m.id}`} d={m.back} opacity="0.10" />
          ))}
          {latitudes.map((l) => (
            <path key={`bl-${l.id}`} d={l.back} opacity="0.10" />
          ))}
        </g>

        {/* Wireframe — front hemisphere */}
        <g fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" clipPath="url(#globeClip)">
          {meridians.map((m) => (
            <path key={`fm-${m.id}`} d={m.front} opacity="0.28" />
          ))}
          {latitudes.map((l) => (
            <path key={`fl-${l.id}`} d={l.front} opacity="0.28" />
          ))}
        </g>

        {/* Logos — back-to-front, ones with z<0 are on far side */}
        {projectedLogos.map((logo) => {
          const visible = logo.z > -R * 0.15;
          if (!visible) return null;
          const cx = CENTER + logo.x;
          const cy = CENTER - logo.y;
          const isFront = logo.z >= 0;
          const opacity = isFront ? 1 : 0.25;
          const scale = 0.6 + 0.4 * Math.max(0, logo.z / R);
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
  const { Mono, Color, name, brand } = logo;
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
      {/* Mono base — fades out on hover */}
      <Mono
        size={LOGO_SIZE - 8}
        className="absolute text-muted-foreground/60 transition-all duration-200 group-hover/logo:opacity-0 group-hover/logo:scale-90"
      />
      {/* Branded overlay — fades in on hover. Use lobehub Color when available; otherwise tint Mono with brand color. */}
      {Color ? (
        <Color
          size={LOGO_SIZE - 8}
          className="absolute opacity-0 transition-all duration-200 group-hover/logo:opacity-100 group-hover/logo:scale-110"
        />
      ) : (
        <Mono
          size={LOGO_SIZE - 8}
          style={{ color: brand }}
          className="absolute opacity-0 transition-all duration-200 group-hover/logo:opacity-100 group-hover/logo:scale-110"
        />
      )}
      {/* Name tooltip */}
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
