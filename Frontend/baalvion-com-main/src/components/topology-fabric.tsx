'use client';

interface TopoNode {
  id: string;
  index: string;
  label: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
}

const CORE = { x: 380, y: 232 };

const NODES: TopoNode[] = [
  { id: 'trade', index: '01', label: 'TRADE', x: 150, y: 96, tx: 150, ty: 62 },
  { id: 'markets', index: '02', label: 'MARKETS', x: 610, y: 96, tx: 610, ty: 62 },
  { id: 'ecosystem', index: '03', label: 'ECOSYSTEM', x: 150, y: 368, tx: 150, ty: 404 },
  { id: 'intelligence', index: '04', label: 'INTELLIGENCE', x: 610, y: 368, tx: 610, ty: 404 },
];

interface TopologyFabricProps {
  active: string | null;
  onHover?: (id: string | null) => void;
  variant?: 'inline' | 'hero';
}

/**
 * Signature C — four operating-domain nodes wired to BAALVION CORE.
 * Edges are hairlines; the active edge runs an accent signal via
 * stroke-dashoffset (CSS, no JS loop). React only toggles `data-active`.
 */
export function TopologyFabric({ active, onHover, variant = 'inline' }: TopologyFabricProps) {
  const isHero = variant === 'hero';

  return (
    <svg
      viewBox="0 0 760 460"
      className={`h-auto w-full ${isHero ? 'opacity-55' : ''}`}
      role="img"
      aria-label="Four operating domains — trade, markets, ecosystem, and intelligence — wired to a single Baalvion core."
      fill="none"
    >
      {/* edges + signals */}
      {NODES.map((n) => {
        const d = `M${CORE.x} ${CORE.y} L${n.x} ${n.y}`;
        const on = active === n.id;
        return (
          <g key={`edge-${n.id}`}>
            <path className="topo-edge" d={d} />
            <path className="topo-signal" d={d} data-active={on ? 'true' : 'false'} />
          </g>
        );
      })}

      {/* core hub — a hairline diamond inside a square register */}
      <g transform={`translate(${CORE.x} ${CORE.y})`}>
        <rect className="topo-node" x={-16} y={-16} width={32} height={32} />
        <rect
          className="topo-node"
          x={-8}
          y={-8}
          width={16}
          height={16}
          transform="rotate(45)"
        />
        {!isHero && (
          <text
            x={0}
            y={52}
            textAnchor="middle"
            className="font-mono"
            fontSize={11}
            letterSpacing="0.18em"
            fill="hsl(var(--muted-2))"
          >
            BAALVION CORE
          </text>
        )}
      </g>

      {/* domain nodes */}
      {NODES.map((n) => {
        const on = active === n.id;
        return (
          <g
            key={`node-${n.id}`}
            onMouseEnter={onHover ? () => onHover(n.id) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
            style={onHover ? { cursor: 'default' } : undefined}
          >
            <rect
              className="topo-ring"
              data-active={on ? 'true' : 'false'}
              x={n.x - 13}
              y={n.y - 13}
              width={26}
              height={26}
              rx={2}
            />
            <rect
              className="topo-node"
              data-active={on ? 'true' : 'false'}
              x={n.x - 5}
              y={n.y - 5}
              width={10}
              height={10}
            />
            {!isHero && (
              <text
                x={n.tx}
                y={n.ty}
                textAnchor="middle"
                className="font-mono"
                fontSize={11}
                letterSpacing="0.16em"
                fill={on ? 'hsl(var(--foreground))' : 'hsl(var(--muted-2))'}
              >
                {n.index} · {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
