import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { CATEGORY_COLORS, CATEGORY_LABELS, TAG_INDEX_SLUGS, VISITED_STORAGE_KEY } from "../../lib/constants";

const W = 1080, H = 780;

// Steeper opacity drop-off for BFS distance
const DISTANCE_OPACITY = [1, 0.55, 0.2, 0.1, 0.06];
const EDGE_DISTANCE_OPACITY = [0.6, 0.2, 0.08, 0.03, 0.02];
const DEFAULT_EDGE_OPACITY = 0.25;

function computeDistances(focalId, edges) {
  const adj = new Map();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source).push(e.target);
    adj.get(e.target).push(e.source);
  }
  const dist = new Map();
  dist.set(focalId, 0);
  const queue = [focalId];
  while (queue.length > 0) {
    const current = queue.shift();
    const d = dist.get(current);
    for (const neighbor of (adj.get(current) || [])) {
      if (!dist.has(neighbor)) {
        dist.set(neighbor, d + 1);
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

function ActiveHeader({ title, slug, nodes, basePath, onNavigate }) {
  const node = nodes.find((n) => n.slug === slug);
  const tag = node?.category;
  const tagLabel = tag && CATEGORY_LABELS[tag];
  const tagColors = tag && CATEGORY_COLORS[tag];
  const tagIndexSlug = tag && TAG_INDEX_SLUGS[tag];
  const pillStyle = { backgroundColor: tagColors?.fill + "20", color: tagColors?.fill };
  return (
    <>
      <h1 className="text-2xl font-medium mb-2">{title || "Loading…"}</h1>
      {tagLabel && (
        <div className="mb-6">
          {tagIndexSlug ? (
            <a href={`${basePath}/${tagIndexSlug}/`}
              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full hover:opacity-80 transition-opacity"
              style={{ ...pillStyle, textDecoration: "none" }}
              onClick={(e) => { e.preventDefault(); onNavigate(tagIndexSlug); }}>
              {tagLabel.toLowerCase()}
            </a>
          ) : (
            <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={pillStyle}>
              {tagLabel.toLowerCase()}
            </span>
          )}
        </div>
      )}
    </>
  );
}

export default function VaultGraph({ nodes, edges, basePath, initialSlug = null }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const contentRef = useRef(null);
  const [positions, setPositions] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [visited, setVisited] = useState(new Set());
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [contentHtml, setContentHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [graphVisible, setGraphVisible] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState(new Set(Object.keys(CATEGORY_LABELS)));
  const hoveredRef = useRef(null);

  const slugToId = useMemo(() => {
    const map = new Map();
    for (const n of nodes) map.set(n.slug, n.id);
    return map;
  }, [nodes]);

  const activeId = activeSlug ? slugToId.get(activeSlug) : null;

  // Derive title and prev/next from node data (no need to parse fetched HTML)
  const sortedCoreNodes = useMemo(() =>
    [...nodes].sort((a, b) => a.order - b.order).filter((n) => n.order > 0),
    [nodes]
  );
  const activeNode = activeSlug ? nodes.find((n) => n.slug === activeSlug) : null;
  const contentTitle = activeNode
    ? activeNode.id
    : activeSlug
      ? activeSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : "A relational protocol architecture for Fabric";
  const prevNext = useMemo(() => {
    if (!activeNode) return { prev: null, next: null };
    const idx = sortedCoreNodes.findIndex((n) => n.slug === activeSlug);
    if (idx === -1) return { prev: null, next: null };
    const prev = idx > 0 ? sortedCoreNodes[idx - 1] : null;
    const next = idx < sortedCoreNodes.length - 1 ? sortedCoreNodes[idx + 1] : null;
    return {
      prev: prev ? { href: `${basePath}/${prev.slug}/`, label: prev.id } : null,
      next: next ? { href: `${basePath}/${next.slug}/`, label: next.id } : null,
    };
  }, [activeNode, activeSlug, sortedCoreNodes, basePath]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_STORAGE_KEY);
      const set = raw ? new Set(JSON.parse(raw)) : new Set();
      if (initialSlug) set.add(initialSlug);
      setVisited(set);
      if (initialSlug) localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify([...set]));
    } catch {}
  }, []);

  const markVisited = useCallback((slug) => {
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(slug);
      try { localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const radiusScale = useMemo(() => {
    const maxLinks = Math.max(...nodes.map((n) => n.linkCount), 1);
    return d3.scaleSqrt().domain([0, maxLinks]).range([6, 22]);
  }, [nodes]);

  useEffect(() => {
    const simNodes = nodes.map((n) => ({ ...n }));
    const simEdges = edges.map((e) => ({ ...e }));

    const sim = d3.forceSimulation(simNodes)
      .force("charge", d3.forceManyBody().strength(-560))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide((d) => radiusScale(d.linkCount) + 22).iterations(4))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(H / 2).strength(0.04))
      .force("link", d3.forceLink(simEdges).id((d) => d.id).distance(110).strength(0.15));

    for (let i = 0; i < 400; i++) sim.tick();
    sim.stop();

    simNodes.forEach((d) => {
      const r = radiusScale(d.linkCount) + 20;
      d.x = Math.max(r, Math.min(W - r, d.x));
      d.y = Math.max(r, Math.min(H - r, d.y));
    });

    const nodeMap = Object.fromEntries(simNodes.map((n) => [n.id, n]));
    const resolvedEdges = simEdges.map((e) => {
      const s = typeof e.source === "object" ? e.source : nodeMap[e.source];
      const t = typeof e.target === "object" ? e.target : nodeMap[e.target];
      return { source: s.id, target: t.id, x1: s.x, y1: s.y, x2: t.x, y2: t.y };
    });

    setPositions({ nodes: simNodes, edges: resolvedEdges });
  }, [nodes, edges, radiusScale]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const zoom = d3.zoom()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    return () => svg.on(".zoom", null);
  }, [positions]);


  // Fetch rendered markdown content from raw pages (same origin, pre-built static HTML)
  const fetchContent = useCallback((url) => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then((r) => r.text())
      .then((html) => {
        if (cancelled) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const section = doc.querySelector("section");
        setContentHtml(section ? section.innerHTML : "<p>Content not found.</p>");
        setLoading(false);
        if (contentRef.current) contentRef.current.scrollTop = 0;
      })
      .catch(() => {
        if (!cancelled) { setContentHtml("<p>Failed to load.</p>"); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return fetchContent(activeSlug
      ? `${basePath}/raw/${activeSlug}/`
      : `${basePath}/raw/overview/`);
  }, [activeSlug, basePath, fetchContent]);

  // Radial distance-based highlighting
  const applyDistanceHighlight = useCallback((focalId) => {
    const svg = svgRef.current;
    if (!svg || !positions) return;

    if (!focalId) {
      svg.querySelectorAll("g[data-nid]").forEach((el) => { el.style.opacity = ""; });
      svg.querySelectorAll("line[data-edge]").forEach((el) => {
        el.setAttribute("opacity", String(DEFAULT_EDGE_OPACITY));
      });
      return;
    }

    const distances = computeDistances(focalId, positions.edges);

    svg.querySelectorAll("g[data-nid]").forEach((el) => {
      const nid = el.getAttribute("data-nid");
      const dist = distances.has(nid) ? distances.get(nid) : Infinity;
      const idx = Math.min(dist, DISTANCE_OPACITY.length - 1);
      el.style.opacity = String(dist === Infinity ? DISTANCE_OPACITY[DISTANCE_OPACITY.length - 1] : DISTANCE_OPACITY[idx]);
    });

    svg.querySelectorAll("line[data-edge]").forEach((el) => {
      const s = el.getAttribute("data-source");
      const t = el.getAttribute("data-target");
      const sd = distances.has(s) ? distances.get(s) : Infinity;
      const td = distances.has(t) ? distances.get(t) : Infinity;
      const edgeDist = Math.min(sd, td);
      const idx = Math.min(edgeDist, EDGE_DISTANCE_OPACITY.length - 1);
      el.setAttribute("opacity", String(edgeDist === Infinity ? EDGE_DISTANCE_OPACITY[EDGE_DISTANCE_OPACITY.length - 1] : EDGE_DISTANCE_OPACITY[idx]));
    });
  }, [positions]);

  useEffect(() => {
    if (!hoveredRef.current) applyDistanceHighlight(activeId);
  }, [activeId, applyDistanceHighlight]);

  const handleMouseEnter = useCallback((n, e) => {
    hoveredRef.current = n.id;
    applyDistanceHighlight(n.id);
    const r = containerRef.current?.getBoundingClientRect();
    if (r) setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, node: n });
  }, [applyDistanceHighlight]);



  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    applyDistanceHighlight(activeId);
    setTooltip(null);
  }, [applyDistanceHighlight, activeId]);

  const navigateTo = useCallback((slug) => {
    hoveredRef.current = null;
    setActiveSlug(slug);
    if (slug) markVisited(slug);
    history.pushState(null, "", slug ? `${basePath}/${slug}/` : `${basePath}/`);
  }, [basePath, markVisited]);

  const handleNodeClick = useCallback((n) => navigateTo(n.slug), [navigateTo]);

  // Click on graph whitespace → deselect node and go home
  const pointerDownPos = useRef(null);
  const handleGraphPointerDown = useCallback((e) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);
  const handleGraphClick = useCallback((e) => {
    // Only act if no node was clicked
    if (e.target.closest("g[data-nid]")) return;
    // Ignore if it was a drag/pan (mouse moved significantly)
    if (pointerDownPos.current) {
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      if (dx * dx + dy * dy > 25) return;
    }
    if (activeSlug) navigateTo(null);
  }, [activeSlug, navigateTo]);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace(basePath, "").replace(/^\/|\/$/g, "");
      if (path === "") {
        setActiveSlug(null);
      } else {
        const node = nodes.find((n) => n.slug === path);
        setActiveSlug(node ? node.slug : null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [basePath, nodes]);

  // Handle clicks on links inside the content pane
  const handleContentClick = useCallback((e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || !href.startsWith(basePath)) return;
    const slug = href.replace(basePath, "").replace(/^\/|\/$/g, "");
    if (slug === "" || slug === "overview") {
      e.preventDefault();
      navigateTo(null);
      return;
    }
    const node = nodes.find((n) => n.slug === slug);
    if (node) {
      e.preventDefault();
      navigateTo(node.slug);
    }
  }, [basePath, nodes, navigateTo]);

  // Highlight graph node when hovering a link in the content pane
  const handleContentMouseOver = useCallback((e) => {
    const link = e.target.closest("a");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || !href.startsWith(basePath)) return;
    const slug = href.replace(basePath, "").replace(/^\/|\/$/g, "");
    const id = slugToId.get(slug);
    if (id) {
      hoveredRef.current = id;
      applyDistanceHighlight(id);
    }
  }, [basePath, slugToId, applyDistanceHighlight]);

  const handleContentMouseOut = useCallback((e) => {
    const link = e.target.closest("a");
    if (!link) return;
    hoveredRef.current = null;
    applyDistanceHighlight(activeId);
  }, [applyDistanceHighlight, activeId]);

  const clearTrail = useCallback(() => {
    try { localStorage.removeItem(VISITED_STORAGE_KEY); } catch {}
    setVisited(new Set());
  }, []);

  const highlightCategory = useCallback((cat) => {
    const svg = svgRef.current;
    if (!svg || !positions) return;
    if (!cat) {
      // Reset: restore default opacities
      svg.querySelectorAll("g[data-nid]").forEach((el) => { el.style.opacity = ""; });
      svg.querySelectorAll("line[data-edge]").forEach((el) => {
        el.setAttribute("opacity", String(DEFAULT_EDGE_OPACITY));
      });
      return;
    }
    // Build a set of node IDs in this category
    const catIds = new Set(positions.nodes.filter((n) => n.category === cat).map((n) => n.id));
    svg.querySelectorAll("g[data-nid]").forEach((el) => {
      const nid = el.getAttribute("data-nid");
      el.style.opacity = catIds.has(nid) ? "1" : "0.08";
    });
    svg.querySelectorAll("line[data-edge]").forEach((el) => {
      const s = el.getAttribute("data-source");
      const t = el.getAttribute("data-target");
      el.setAttribute("opacity", (catIds.has(s) || catIds.has(t)) ? "0.4" : "0.03");
    });
  }, [positions]);

  const toggleCategory = useCallback((cat) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const svgContent = useMemo(() => {
    if (!positions) return null;
    const visibleNodeIds = new Set(
      positions.nodes.filter((n) => visibleCategories.has(n.category)).map((n) => n.id)
    );
    return (
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ cursor: "grab" }}>
        <g ref={gRef}>
          {positions.edges.map((e, i) => {
            if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return null;
            return (
              <line key={i} data-edge data-source={e.source} data-target={e.target}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="var(--color-border-secondary, #b4b2a9)" strokeWidth={1} opacity={DEFAULT_EDGE_OPACITY} />
            );
          })}
          {positions.nodes.map((n) => {
            if (!visibleCategories.has(n.category)) return null;
            const r = radiusScale(n.linkCount);
            const colors = CATEGORY_COLORS[n.category] || CATEGORY_COLORS.index;
            const isCurrent = n.slug === activeSlug;
            const isVisited = visited.has(n.slug);
            const defaultOpacity = isVisited ? 0.9 : 0.4;

            return (
              <g key={n.id} data-nid={n.id}
                transform={`translate(${n.x},${n.y})`}
                style={{ opacity: defaultOpacity }}
                onMouseEnter={(e) => handleMouseEnter(n, e)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleNodeClick(n)}
                className="cursor-pointer">
                {isCurrent && (
                  <circle r={r + 5} fill="none" stroke={colors.fill} strokeWidth={2} opacity={0.4} />
                )}
                <circle r={r} fill={colors.fill} stroke={colors.stroke} strokeWidth={0.8} />
                <text dy={r + 12} textAnchor="middle"
                  fill="var(--color-text-secondary, #5f5e5a)"
                  fontSize={n.linkCount > 6 ? 10 : 9}
                  className="select-none pointer-events-none">
                  {n.id.length > 35 ? n.id.slice(0, 32) + "…" : n.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  }, [positions, radiusScale, activeSlug, visited, visibleCategories, handleMouseEnter, handleMouseLeave, handleNodeClick]);

  if (!positions) {
    return <div className="h-96 flex items-center justify-center text-sm opacity-50">Computing layout…</div>;
  }

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      {/* Header bar with graph toggle + nav */}
      <div className="flex justify-between items-center px-4 py-2 text-sm shrink-0"
        style={{ borderBottom: "1px solid var(--color-border-tertiary, #d3d1c7)" }}>
        <button onClick={() => setGraphVisible((v) => !v)}
          className="opacity-60 hover:opacity-100 transition-opacity">
          {graphVisible ? "Hide graph" : "Show graph"}
        </button>
        <nav className="flex gap-3 opacity-50">
          <a href={`${basePath}/`} className="hover:opacity-80"
            style={{ textDecoration: "none" }}
            onClick={(e) => { e.preventDefault(); navigateTo(null); }}>Home</a>
          <span className="opacity-30">&middot;</span>
          <a href={`${basePath}/glossary/`} className="hover:opacity-80"
            style={{ textDecoration: "none" }}
            onClick={(e) => { e.preventDefault(); navigateTo("glossary"); }}>Glossary</a>
          <span className="opacity-30">&middot;</span>
          <a href={`${basePath}/sources/`} className="hover:opacity-80"
            style={{ textDecoration: "none" }}
            onClick={(e) => { e.preventDefault(); navigateTo("sources"); }}>Sources</a>
        </nav>
      </div>

      {/* Main split */}
      <div className="flex flex-1 min-h-0">
        {/* Graph pane */}
        {graphVisible && (
          <div className="relative w-1/2 shrink-0" ref={containerRef}
            onPointerDown={handleGraphPointerDown}
            onClick={handleGraphClick}>
            {svgContent}

            {tooltip && (
              <div className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs border z-10 max-w-64"
                style={{
                  left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth || 600) - 270),
                  top: tooltip.y - 10,
                  background: "var(--color-background-secondary, #f5f4ef)",
                  borderColor: "var(--color-border-tertiary, #d3d1c7)",
                  color: "var(--color-text-primary, #2c2c2a)",
                }}>
                <div className="font-medium mb-0.5">{tooltip.node.id}</div>
                <div className="opacity-70">{tooltip.node.description}</div>
              </div>
            )}

            {/* Legend with toggleable categories + clear trail */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-xs opacity-70">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none"
                    onMouseEnter={() => highlightCategory(key)}
                    onMouseLeave={() => {
                      highlightCategory(null);
                      if (activeId) applyDistanceHighlight(activeId);
                    }}>
                    <input type="checkbox" checked={visibleCategories.has(key)}
                      onChange={() => toggleCategory(key)}
                      className="sr-only" />
                    <span className="inline-block w-2.5 h-2.5 rounded-full transition-opacity"
                      style={{
                        background: CATEGORY_COLORS[key].fill,
                        opacity: visibleCategories.has(key) ? 1 : 0.25,
                      }} />
                    <span style={{ opacity: visibleCategories.has(key) ? 1 : 0.4 }}>{label}</span>
                  </label>
                ))}
              </div>
              {visited.size > 0 && (
                <button onClick={clearTrail}
                  className="opacity-50 hover:opacity-80 underline shrink-0"
                  style={{ textDecorationColor: "var(--color-border-secondary)" }}>
                  Clear trail
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content pane */}
        <div className={`${graphVisible ? "w-1/2 border-l" : "flex-1"} overflow-y-auto`}
          ref={contentRef}
          onClick={handleContentClick}
          onMouseOver={handleContentMouseOver}
          onMouseOut={handleContentMouseOut}
          style={{ borderColor: "var(--color-border-tertiary, #d3d1c7)" }}>
          <div className={`px-8 py-8 ${graphVisible ? "max-w-2xl" : "max-w-2xl mx-auto"}`}>
            {activeSlug && (
              <ActiveHeader
                title={contentTitle}
                slug={activeSlug}
                nodes={nodes}
                basePath={basePath}
                onNavigate={navigateTo}
              />
            )}
            {!activeSlug && contentTitle && (
              <h1 className="text-2xl font-medium mb-6">{contentTitle}</h1>
            )}
            {loading ? (
              <div className="text-sm opacity-50">Loading…</div>
            ) : (
              <div className="leading-relaxed text-base"
                // Content is pre-built static HTML from the same origin
                dangerouslySetInnerHTML={{ __html: contentHtml }} />
            )}
            {/* Prev/next navigation */}
            {activeSlug && (prevNext.prev || prevNext.next) && (
              <nav className="mt-12 pt-6 border-t flex justify-between text-sm"
                style={{ borderColor: "var(--color-border-tertiary, #d3d1c7)" }}>
                {prevNext.prev ? (
                  <a href={prevNext.prev.href} className="opacity-60 hover:opacity-100">
                    &larr; {prevNext.prev.label}
                  </a>
                ) : <span />}
                {prevNext.next ? (
                  <a href={prevNext.next.href} className="opacity-60 hover:opacity-100 text-right">
                    {prevNext.next.label} &rarr;
                  </a>
                ) : <span />}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
