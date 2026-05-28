import React, { useState, useMemo } from 'react';
import { cn } from '@/ui/cn';

export interface GraphNode {
  id: string;
  label: string;
  type: 'hypothesis' | 'experiment';
  status: string;
}

export interface GraphEdge {
  from: string;  // hypothesis id
  to: string;    // experiment id
}

interface HypothesisGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  className?: string;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

const hypStatusColors: Record<string, string> = {
  proposed: '#64748b',
  testing: '#f59e0b',
  confirmed: '#10b981',
  refuted: '#ef4444',
};

const expStatusColors: Record<string, string> = {
  planned: '#64748b',
  running: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
};

export function HypothesisGraph({ nodes, edges, className, height = 260, onNodeClick }: HypothesisGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { hypNodes, expNodes, positioned, width } = useMemo(() => {
    const hypNodes = nodes.filter(n => n.type === 'hypothesis');
    const expNodes = nodes.filter(n => n.type === 'experiment');

    if (nodes.length === 0) {
      return { hypNodes, expNodes, positioned: [], width: 300 };
    }

    // Layout: hypotheses on left, experiments on right
    const leftX = 18;
    const rightX = 78;
    const usableHeight = 80;
    const topPad = 10;

    const hypSpacing = hypNodes.length > 1 ? usableHeight / (hypNodes.length) : usableHeight / 2;
    const expSpacing = expNodes.length > 1 ? usableHeight / (expNodes.length) : usableHeight / 2;

    const positioned: Array<GraphNode & { x: number; y: number }> = [];

    hypNodes.forEach((n, i) => {
      positioned.push({
        ...n,
        x: leftX,
        y: topPad + (hypNodes.length > 1 ? (i + 0.5) * hypSpacing : hypSpacing),
      });
    });

    expNodes.forEach((n, i) => {
      positioned.push({
        ...n,
        x: rightX,
        y: topPad + (expNodes.length > 1 ? (i + 0.5) * expSpacing : expSpacing),
      });
    });

    return { hypNodes, expNodes, positioned, width: 100 };
  }, [nodes]);

  const posMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of positioned) map.set(p.id, { x: p.x, y: p.y });
    return map;
  }, [positioned]);

  const isHighlighted = (id: string) => {
    if (!hovered) return false;
    if (hovered === id) return true;
    // Highlight connected nodes
    return edges.some(e =>
      (e.from === hovered && e.to === id) ||
      (e.to === hovered && e.from === id)
    );
  };

  const isEdgeHighlighted = (edge: GraphEdge) => {
    if (!hovered) return false;
    return edge.from === hovered || edge.to === hovered;
  };

  if (nodes.length === 0) return null;

  const nodeRadius = 3.2;

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} 100`}
        className="w-full"
        style={{ height }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = posMap.get(edge.from);
          const to = posMap.get(edge.to);
          if (!from || !to) return null;

          const highlighted = isEdgeHighlighted(edge);
          const midX = (from.x + to.x) / 2;

          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
              fill="none"
              stroke={highlighted ? '#14b8a6' : 'rgba(148,163,184,0.18)'}
              strokeWidth={highlighted ? 0.6 : 0.35}
              className="transition-all duration-200"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* Unlinked indicator lines */}
        {positioned.filter(n => {
          if (n.type !== 'experiment') return false;
          return !edges.some(e => e.to === n.id);
        }).map(n => (
          <text
            key={`unlinked-${n.id}`}
            x={n.x + nodeRadius + 1}
            y={n.y - nodeRadius - 1}
            fill="rgba(148,163,184,0.35)"
            fontSize="2"
            fontStyle="italic"
          >
            ?
          </text>
        ))}

        {/* Nodes */}
        {positioned.map((node) => {
          const color = node.type === 'hypothesis'
            ? (hypStatusColors[node.status] || '#64748b')
            : (expStatusColors[node.status] || '#64748b');

          const highlighted = isHighlighted(node.id);
          const dimmed = hovered !== null && !highlighted && hovered !== node.id;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick?.(node)}
              className={onNodeClick ? 'cursor-pointer' : undefined}
            >
              {/* Glow */}
              {highlighted && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius + 1.5}
                  fill={color}
                  opacity={0.15}
                />
              )}
              {/* Shape: circle for hypothesis, rounded rect for experiment */}
              {node.type === 'hypothesis' ? (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={highlighted ? nodeRadius + 0.4 : nodeRadius}
                  fill={color}
                  opacity={dimmed ? 0.3 : 0.85}
                  className="transition-all duration-200"
                />
              ) : (
                <rect
                  x={node.x - nodeRadius}
                  y={node.y - nodeRadius * 0.75}
                  width={highlighted ? (nodeRadius + 0.4) * 2 : nodeRadius * 2}
                  height={highlighted ? (nodeRadius + 0.4) * 1.5 : nodeRadius * 1.5}
                  rx={1}
                  fill={color}
                  opacity={dimmed ? 0.3 : 0.85}
                  className="transition-all duration-200"
                />
              )}
              {/* Label */}
              <text
                x={node.type === 'hypothesis' ? node.x - nodeRadius - 1.5 : node.x + nodeRadius + 1.5}
                y={node.y + 1}
                textAnchor={node.type === 'hypothesis' ? 'end' : 'start'}
                fill={dimmed ? 'rgba(148,163,184,0.3)' : highlighted ? 'rgba(226,232,240,0.95)' : 'rgba(148,163,184,0.75)'}
                fontSize="2.8"
                fontWeight={highlighted ? '600' : '400'}
                className="transition-colors duration-200 pointer-events-none"
              >
                {node.label.length > 18 ? node.label.slice(0, 18) + '...' : node.label}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(2, 96)">
          <circle cx={0} cy={0} r={1.5} fill="#64748b" opacity={0.7} />
          <text x={3} y={1} fill="rgba(148,163,184,0.5)" fontSize="2.2">假设</text>
          <rect x={12} y={-1.5} width={3} height={3} rx={0.5} fill="#64748b" opacity={0.7} />
          <text x={17} y={1} fill="rgba(148,163,184,0.5)" fontSize="2.2">实验</text>
        </g>
      </svg>
    </div>
  );
}
