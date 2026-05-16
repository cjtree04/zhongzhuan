const NODES = [
  { id: "NA-01", x: 200, y: 230, region: "NORTH AMERICA" },
  { id: "EU-02", x: 310, y: 195, region: "EUROPE" },
  { id: "AS-03", x: 405, y: 245, region: "ASIA" },
  { id: "SA-04", x: 230, y: 385, region: "SOUTH AMERICA" },
  { id: "AF-05", x: 320, y: 405, region: "AFRICA" },
  { id: "OC-06", x: 400, y: 380, region: "OCEANIA" },
] as const;

const ROUTES = [
  ["NA-01", "EU-02"],
  ["EU-02", "AS-03"],
  ["AS-03", "OC-06"],
  ["NA-01", "AS-03"],
  ["SA-04", "AF-05"],
  ["EU-02", "AF-05"],
] as const;

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // bow the control point outward from globe center (300,300)
  const dx = mx - 300;
  const dy = my - 300;
  const len = Math.hypot(dx, dy) || 1;
  const lift = 90;
  const cx = mx + (dx / len) * lift;
  const cy = my + (dy / len) * lift;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function HeroGlobe() {
  return (
    <div className="relative aspect-square w-full max-w-[560px] text-foreground">
      {/* Corner brackets — blueprint crop marks */}
      <CornerBrackets />

      {/* Top-left schematic stamp */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-1 bg-brand" />
        FIG.01 · ROUTING SCHEMATIC
      </div>

      {/* Top-right meta — kept out of the bottom ruler */}
      <div className="pointer-events-none absolute right-4 top-4 z-10 font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70">
        ZTKN · 2026.Q2
      </div>

      <svg
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        className="block h-full w-full"
        role="img"
        aria-label="全球 API 路由示意图"
      >
        <defs>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.08"
            />
          </pattern>
          <radialGradient id="globeFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="85%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        <rect width="600" height="600" fill="url(#grid)" />

        {/* Globe wireframe */}
        <g
          transform="translate(300 300)"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          {/* Outer boundary */}
          <circle r="180" opacity="0.45" />
          <circle r="180" fill="url(#globeFade)" stroke="none" />

          {/* Latitudes — horizontal ellipses */}
          {[30, 60, 95, 130, 155, 170].map((ry) => (
            <ellipse
              key={`lat-${ry}`}
              rx="180"
              ry={ry}
              opacity="0.18"
              strokeDasharray="2 3"
            />
          ))}

          {/* Longitudes — rotated ellipses */}
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <ellipse
              key={`lng-${angle}`}
              rx="50"
              ry="180"
              opacity="0.18"
              strokeDasharray="2 3"
              transform={`rotate(${angle})`}
            />
          ))}

          {/* Equator + prime meridian — slightly stronger */}
          <line x1="-180" y1="0" x2="180" y2="0" opacity="0.32" />
          <line x1="0" y1="-180" x2="0" y2="180" opacity="0.32" />
        </g>

        {/* Routes — animated dashed arcs */}
        <g
          fill="none"
          stroke="var(--brand)"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          {ROUTES.map(([fromId, toId], i) => {
            const a = nodeById(fromId);
            const b = nodeById(toId);
            return (
              <path
                key={`${fromId}-${toId}`}
                d={arcPath(a, b)}
                strokeDasharray="3 6"
                opacity="0.85"
                style={{
                  animation: `ztkn-flow 4s linear infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            );
          })}
        </g>

        {/* Endpoint nodes */}
        <g>
          {NODES.map((node, i) => (
            <g key={node.id}>
              {/* Pulsing halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r="3"
                fill="var(--brand)"
                opacity="0.4"
                style={{
                  animation: `ztkn-pulse 2.4s ease-out infinite`,
                  animationDelay: `${i * 0.35}s`,
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              />
              {/* Solid node */}
              <circle
                cx={node.x}
                cy={node.y}
                r="3.5"
                fill="var(--brand)"
                stroke="var(--background)"
                strokeWidth="1.5"
              />
              {/* Crosshair tick */}
              <g stroke="var(--brand)" strokeWidth="1" opacity="0.65">
                <line
                  x1={node.x - 9}
                  y1={node.y}
                  x2={node.x - 5}
                  y2={node.y}
                />
                <line
                  x1={node.x + 5}
                  y1={node.y}
                  x2={node.x + 9}
                  y2={node.y}
                />
              </g>
              {/* Label */}
              <text
                x={node.x + 12}
                y={node.y + 4}
                fill="currentColor"
                opacity="0.55"
                fontFamily="var(--font-geist-mono)"
                fontSize="10"
                letterSpacing="0.05em"
              >
                {node.id}
              </text>
            </g>
          ))}
        </g>

        {/* Bottom axis tick markers — industrial ruler */}
        <g stroke="currentColor" opacity="0.35" strokeWidth="1">
          {Array.from({ length: 13 }).map((_, i) => {
            const x = 60 + i * 40;
            const long = i % 3 === 0;
            return (
              <line
                key={`tick-${i}`}
                x1={x}
                y1={552}
                x2={x}
                y2={long ? 562 : 558}
              />
            );
          })}
        </g>
        <text
          x={60}
          y={576}
          fill="currentColor"
          opacity="0.4"
          fontFamily="var(--font-geist-mono)"
          fontSize="9"
          letterSpacing="0.18em"
        >
          —180°
        </text>
        <text
          x={296}
          y={576}
          fill="currentColor"
          opacity="0.4"
          fontFamily="var(--font-geist-mono)"
          fontSize="9"
          letterSpacing="0.18em"
        >
          0°
        </text>
        <text
          x={528}
          y={576}
          fill="currentColor"
          opacity="0.4"
          fontFamily="var(--font-geist-mono)"
          fontSize="9"
          letterSpacing="0.18em"
        >
          +180°
        </text>
      </svg>

      <style>{`
        @keyframes ztkn-flow {
          to { stroke-dashoffset: -36; }
        }
        @keyframes ztkn-pulse {
          0% { r: 4; opacity: 0.55; }
          80% { r: 22; opacity: 0; }
          100% { r: 22; opacity: 0; }
        }
      `}</style>
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
