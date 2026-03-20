export const VISITED_STORAGE_KEY = "rp-visited";

export const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
  core:       { fill: "#2563eb", stroke: "#1d4ed8" },   // blue
  foundation: { fill: "#0d9488", stroke: "#0f766e" },   // teal
  domain:     { fill: "#16a34a", stroke: "#15803d" },   // green
  protocol:   { fill: "#8b5cf6", stroke: "#7c3aed" },   // violet
  principle:  { fill: "#ea580c", stroke: "#c2410c" },   // orange
  index:      { fill: "#6b7280", stroke: "#4b5563" },   // grey
};

export const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  foundation: "Foundation",
  domain: "Domain",
  protocol: "Protocol",
  principle: "Principle",
};

/** Tags that link to an index page when clicked. Slugs only — basePath is prepended at render time. */
export const TAG_INDEX_SLUGS: Record<string, string> = {
  protocol: "protocols",
  principle: "protocol-design-is-guided-by-a-set-of-principles",
};
