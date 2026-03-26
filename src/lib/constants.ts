export const VISITED_STORAGE_KEY = "rp-visited";

export const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
  core:       { fill: "#2563eb", stroke: "#1d4ed8" },   // blue
  foundation: { fill: "#db2777", stroke: "#be185d" },   // pink
  field:      { fill: "#16a34a", stroke: "#15803d" },   // green
  protocol:   { fill: "#8b5cf6", stroke: "#7c3aed" },   // violet
  principle:  { fill: "#f59e0b", stroke: "#d97706" },   // amber
  index:      { fill: "#6b7280", stroke: "#4b5563" },   // grey
};

export const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  foundation: "Foundation",
  field: "Field",
  protocol: "Protocol",
  principle: "Principle",
};

/** Tags that link to an index page when clicked. Slugs only — basePath is prepended at render time. */
export const TAG_INDEX_SLUGS: Record<string, string> = {
  field: "living-systems-become-protocol-fields",
  protocol: "protocols",
  principle: "protocol-design-is-guided-by-a-set-of-principles",
};
