import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

const protocols = [
  { id: "decision", label: "Decision-making", color: "#0F6E56" },
  { id: "resource", label: "Resource flow", color: "#534AB7" },
  { id: "conflict", label: "Conflict engagement", color: "#D85A30" },
  { id: "feedback", label: "Feedback & learning", color: "#185FA5" },
  { id: "care", label: "Care & support", color: "#993556" },
];
const pMap = Object.fromEntries(protocols.map((p) => [p.id, p]));

const networkNodes = [
  { id: "A", name: "Grassroots collective", adopted: ["decision", "resource", "conflict", "feedback", "care"] },
  { id: "B", name: "Housing cooperative", adopted: ["decision", "resource", "conflict", "feedback"] },
  { id: "C", name: "Mutual aid network", adopted: ["decision", "resource", "conflict", "care"] },
  { id: "D", name: "Climate action group", adopted: ["decision", "resource", "feedback", "care"] },
  { id: "E", name: "Workers' cooperative", adopted: ["decision", "resource", "conflict"] },
  { id: "F", name: "Community garden", adopted: ["decision", "feedback"] },
  { id: "G", name: "Tenants' union", adopted: ["decision", "care"] },
  { id: "H", name: "Education collective", adopted: ["decision", "resource", "feedback", "care"] },
  { id: "I", name: "Food sovereignty project", adopted: ["decision", "resource"] },
];

export default function NetworkDiagram() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const hoveredRef = useRef(null);
  const rafRef = useRef(null);
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    const W = 680, H = 560, R = 22;
    const nodes = networkNodes.map((n) => ({ ...n }));
    const links = [];
    const linkCounts = {};
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].adopted.filter((p) => nodes[j].adopted.includes(p));
        const k = nodes[i].id + "-" + nodes[j].id;
        linkCounts[k] = shared.length;
        shared.forEach((p, idx) => {
          links.push({ source: nodes[i].id, target: nodes[j].id, protocol: p, offset: idx, total: shared.length });
        });
      }
    }
    const sim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-1350))
      .force("center", d3.forceCenter(W / 2, H * 0.45))
      .force("collision", d3.forceCollide(R + 30))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(H * 0.45).strength(0.04))
      .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => {
        const k = [d.source.id || d.source, d.target.id || d.target].sort().join("-");
        return 450 - (linkCounts[k] || 1) * 60;
      }).strength((d) => {
        const k = [d.source.id || d.source, d.target.id || d.target].sort().join("-");
        return 0.08 + (linkCounts[k] || 1) * 0.06;
      }));
    for (let i = 0; i < 400; i++) sim.tick();
    sim.stop();
    nodes.forEach((d) => {
      d.x = Math.max(R + 10, Math.min(W - R - 10, d.x));
      d.y = Math.max(R + 20, Math.min(H - R - 10, d.y));
    });
    const resolvedLinks = links.map((l) => {
      const s = typeof l.source === "object" ? l.source : nodes.find((n) => n.id === l.source);
      const t = typeof l.target === "object" ? l.target : nodes.find((n) => n.id === l.target);
      const dx = t.x - s.x, dy = t.y - s.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      const spread = 4, off = (l.offset - (l.total - 1) / 2) * spread;
      const nx = -dy / len, ny = dx / len;
      return { ...l, x1: s.x + nx * off, y1: s.y + ny * off, x2: t.x + nx * off, y2: t.y + ny * off, sid: s.id, tid: t.id };
    });
    setPositions({ nodes, links: resolvedLinks });
  }, []);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const applyHoverEffect = useCallback((nodeId) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll("line[data-link]").forEach((el) => {
      const sid = el.getAttribute("data-sid");
      const tid = el.getAttribute("data-tid");
      el.setAttribute("opacity",
        nodeId ? ((sid === nodeId || tid === nodeId) ? "0.8" : "0.1") : "0.45"
      );
    });
    svg.querySelectorAll("g[data-nid] > circle:first-child").forEach((el) => {
      const nid = el.parentElement.getAttribute("data-nid");
      el.setAttribute("stroke-width", nid === nodeId ? "1.5" : "0.5");
    });
  }, []);

  const handleMouseEnter = useCallback((n, e) => {
    hoveredRef.current = n.id;
    applyHoverEffect(n.id);
    const r = containerRef.current?.getBoundingClientRect();
    if (r) setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, node: n });
  }, [applyHoverEffect]);

  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = containerRef.current?.getBoundingClientRect();
      if (r && hoveredRef.current) {
        setTooltip((t) => t ? { ...t, x: e.clientX - r.left, y: e.clientY - r.top } : null);
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    applyHoverEffect(null);
    setTooltip(null);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, [applyHoverEffect]);

  const svgContent = useMemo(() => {
    if (!positions) return null;
    return (
      <svg ref={svgRef} viewBox="0 0 680 560" className="w-full">
        {positions.links.map((l, i) => (
          <line key={i} data-link data-sid={l.sid} data-tid={l.tid}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={pMap[l.protocol].color} strokeWidth={1.2} opacity={0.45} />
        ))}
        {positions.nodes.map((n) => {
          const dotR = 3, gap = dotR * 2 + 2, totalW = (n.adopted.length - 1) * gap;
          return (
            <g key={n.id} data-nid={n.id} transform={`translate(${n.x},${n.y})`}
              onMouseEnter={(e) => handleMouseEnter(n, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="cursor-default">
              <circle r={22} fill="var(--color-background-secondary, #f5f4ef)" stroke="var(--color-border-secondary, #b4b2a9)" strokeWidth={0.5} />
              {n.adopted.map((p, i) => (<circle key={p} cx={-totalW / 2 + i * gap} cy={0} r={dotR} fill={pMap[p].color} />))}
            </g>
          );
        })}
      </svg>
    );
  }, [positions, handleMouseEnter, handleMouseMove, handleMouseLeave]);

  if (!positions) return <div className="h-64 flex items-center justify-center text-sm opacity-50">Computing layout…</div>;
  return (
    <div className="relative my-6" ref={containerRef}>
      {svgContent}
      {tooltip && (
        <div className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs border z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, background: "var(--color-background-secondary, #f5f4ef)", borderColor: "var(--color-border-tertiary, #d3d1c7)", color: "var(--color-text-primary, #2c2c2a)" }}>
          <div className="font-medium mb-1">{tooltip.node.name}</div>
          {tooltip.node.adopted.map((p) => (<span key={p} className="inline-block mr-1.5" style={{ color: pMap[p].color }}>{pMap[p].label}</span>))}
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs opacity-70">
        {protocols.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0 border-t-2" style={{ borderColor: p.color }} />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
