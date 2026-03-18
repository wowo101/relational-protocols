import { getCollection } from "astro:content";

export interface GraphNode {
  id: string;
  slug: string;
  category: "core" | "foundation" | "domain" | "protocol" | "principle" | "index";
  description: string;
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function toSlug(id: string): string {
  return id.toLowerCase().replace(/\s+/g, "-");
}

function deriveCategory(
  order: number,
  tags?: string[],
): GraphNode["category"] {
  if (tags?.includes("domain")) return "domain";
  if (tags?.includes("protocol")) return "protocol";
  if (tags?.includes("principle")) return "principle";
  if (order >= 1 && order <= 8) return "core";
  if (order >= 10 && order <= 15) return "foundation";
  return "index";
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

export async function buildGraphData(): Promise<GraphData> {
  const pages = await getCollection("pages");

  const idSet = new Set(pages.map((p) => p.id));
  const idLower = new Map(pages.map((p) => [p.id.toLowerCase(), p.id]));

  const nodes: GraphNode[] = pages
    .filter((p) => p.data.order !== 0)
    .map((p) => ({
      id: p.id,
      slug: toSlug(p.id),
      category: deriveCategory(p.data.order, p.data.tags),
      description: p.data.description,
      linkCount: 0,
    }));

  const nodeIds = new Set(nodes.map((n) => n.id));

  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const page of pages) {
    if (page.data.order === 0) continue;
    const body = page.body || "";
    let match: RegExpExecArray | null;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(body)) !== null) {
      const target = match[1].trim();
      const resolved = idSet.has(target)
        ? target
        : idLower.get(target.toLowerCase());
      if (!resolved || !nodeIds.has(resolved)) continue;
      if (resolved === page.id) continue;
      const key = `${page.id} -> ${resolved}`;
      if (edgeSet.has(key)) continue;
      edgeSet.add(key);
      edges.push({ source: page.id, target: resolved });
    }
  }

  const countMap = new Map<string, number>();
  for (const e of edges) {
    countMap.set(e.source, (countMap.get(e.source) || 0) + 1);
    countMap.set(e.target, (countMap.get(e.target) || 0) + 1);
  }
  for (const node of nodes) {
    node.linkCount = countMap.get(node.id) || 0;
  }

  return { nodes, edges };
}
