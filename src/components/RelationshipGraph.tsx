import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Shield,
  User,
  History,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react';
import { LoreEntity, LoreType } from '../types';

interface RelationshipGraphProps {
  entities: LoreEntity[];
  onSelectEntity: (entity: LoreEntity) => void;
  onExpandEntity: (entity: LoreEntity) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  entity: LoreEntity;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  entities,
  onSelectEntity,
  onExpandEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodePosition[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | LoreType>('all');

  // Initialize nodes in a balanced orbital / force layout
  useEffect(() => {
    if (entities.length === 0) return;

    const width = 800;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.36;

    // Cluster by type
    const initialNodes: NodePosition[] = entities.map((entity, idx) => {
      // Position in orbital circle with slight jitter
      const angle = (idx / entities.length) * 2 * Math.PI;
      const r = radius + (idx % 2 === 0 ? 30 : -30);
      return {
        id: entity.id,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        vx: 0,
        vy: 0,
        entity,
      };
    });

    setNodes(initialNodes);
  }, [entities]);

  // Extract all edges from relationships
  const edges: Array<{
    source: NodePosition;
    target: NodePosition;
    relation: string;
    type: string;
  }> = [];

  const nodeMap = new Map<string, NodePosition>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  nodes.forEach(sourceNode => {
    if (filterType !== 'all' && sourceNode.entity.type !== filterType) return;
    (sourceNode.entity.relationships || []).forEach(rel => {
      const targetNode = nodeMap.get(rel.targetId);
      if (targetNode) {
        if (filterType === 'all' || targetNode.entity.type === filterType) {
          edges.push({
            source: sourceNode,
            target: targetNode,
            relation: rel.relation,
            type: rel.type,
          });
        }
      }
    });
  });

  // Handle Dragging
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      setNodes(prev =>
        prev.map(n => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: n.x + e.movementX / zoom,
              y: n.y + e.movementY / zoom,
            };
          }
          return n;
        })
      );
    } else if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const getNodeColor = (type?: LoreType | string) => {
    switch (type) {
      case 'region': return { bg: '#ecfdf5', border: '#059669', text: '#065f46', fill: '#10b981' };
      case 'faction': return { bg: '#eef2ff', border: '#4f46e5', text: '#3730a3', fill: '#6366f1' };
      case 'character': return { bg: '#fffbeb', border: '#d97706', text: '#92400e', fill: '#f59e0b' };
      case 'event': return { bg: '#faf5ff', border: '#9333ea', text: '#6b21a8', fill: '#a855f7' };
      default: return { bg: '#f8fafc', border: '#64748b', text: '#334155', fill: '#64748b' };
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'rival': return '#ef4444';
      case 'ally': return '#10b981';
      case 'ruler_of': return '#6366f1';
      case 'located_in': return '#0ea5e9';
      default: return '#94a3b8';
    }
  };

  const isConnected = (nodeId: string) => {
    if (!hoveredNodeId) return true;
    if (nodeId === hoveredNodeId) return true;
    return edges.some(
      e => (e.source.id === hoveredNodeId && e.target.id === nodeId) ||
           (e.target.id === hoveredNodeId && e.source.id === nodeId)
    );
  };

  return (
    <div className="space-y-3">
      {/* Control Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Map:
          </span>
          <div className="flex items-center gap-1">
            {(['all', 'region', 'faction', 'character', 'event'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filterType === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'event' ? 'History' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="text-[11px] font-mono text-slate-400 px-2">
            {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsPanning(true)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[580px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner select-none"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Legend */}
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1 shadow-lg">
          <div className="font-semibold text-slate-100 font-cinzel text-xs mb-1">Entity Factions & Links</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Region
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 ml-2"></span> Faction
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Character
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ml-2"></span> Event
          </div>
          <div className="pt-1 mt-1 border-t border-slate-800 text-[10px] text-slate-400">
            • Drag nodes to arrange &bull; Click node to inspect &bull; Red line = Rival
          </div>
        </div>

        <svg
          className="w-full h-full"
          viewBox="0 0 800 550"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edge Lines */}
            {edges.map((edge, idx) => {
              const color = getEdgeColor(edge.type);
              const isRival = edge.type === 'rival';
              const midX = (edge.source.x + edge.target.x) / 2;
              const midY = (edge.source.y + edge.target.y) / 2;
              const isHighlighted =
                hoveredNodeId === edge.source.id || hoveredNodeId === edge.target.id;
              const opacity = hoveredNodeId
                ? isHighlighted ? 1 : 0.15
                : 0.6;

              return (
                <g key={idx} opacity={opacity}>
                  <line
                    x1={edge.source.x}
                    y1={edge.source.y}
                    x2={edge.target.x}
                    y2={edge.target.y}
                    stroke={color}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    strokeDasharray={isRival ? '4 3' : undefined}
                  />
                  {/* Text Badge on Edge */}
                  <rect
                    x={midX - 35}
                    y={midY - 9}
                    width={70}
                    height={16}
                    rx={4}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={0.7}
                    opacity={0.9}
                  />
                  <text
                    x={midX}
                    y={midY + 3}
                    fill="#cbd5e1"
                    fontSize={8.5}
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {edge.relation.length > 13 ? edge.relation.slice(0, 12) + '…' : edge.relation}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const visible = filterType === 'all' || node.entity.type === filterType;
              if (!visible) return null;

              const style = getNodeColor(node.entity.type);
              const active = isConnected(node.id);
              const isHovered = hoveredNodeId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => handleMouseDownNode(e, node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => onSelectEntity(node.entity)}
                  className="cursor-pointer transition-transform"
                  opacity={active ? 1 : 0.25}
                >
                  {/* Outer pulse when hovered */}
                  {isHovered && (
                    <circle
                      r={30}
                      fill="none"
                      stroke={style.fill}
                      strokeWidth={2}
                      opacity={0.4}
                      className="animate-ping"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={22}
                    fill="#1e293b"
                    stroke={style.border}
                    strokeWidth={isHovered ? 3 : 2}
                  />
                  <circle
                    r={18}
                    fill={style.fill}
                    opacity={0.85}
                  />

                  {/* Icon glyph inside circle */}
                  <text
                    x={0}
                    y={4}
                    fontSize={12}
                    textAnchor="middle"
                    fill="#ffffff"
                    pointerEvents="none"
                    fontWeight="bold"
                  >
                    {node.entity.type === 'region' && '🏞️'}
                    {node.entity.type === 'faction' && '🛡️'}
                    {node.entity.type === 'character' && '👤'}
                    {node.entity.type === 'event' && '📜'}
                  </text>

                  {/* Entity Label */}
                  <rect
                    x={-55}
                    y={28}
                    width={110}
                    height={18}
                    rx={5}
                    fill="#0f172a"
                    stroke={style.border}
                    strokeWidth={0.8}
                    opacity={0.95}
                  />
                  <text
                    x={0}
                    y={40}
                    fill="#f1f5f9"
                    fontSize={9.5}
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {node.entity.name.length > 16 ? node.entity.name.slice(0, 15) + '…' : node.entity.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
