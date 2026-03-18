export const VISITED_STORAGE_KEY = "rp-visited";

export const CATEGORY_COLORS: Record<string, { fill: string; stroke: string }> = {
  core:       { fill: "#3d5a80", stroke: "#2c4466" },
  foundation: { fill: "#5f8a7a", stroke: "#4a6e62" },
  domain:     { fill: "#3d6b35", stroke: "#2d5028" },
  protocol:   { fill: "#35456b", stroke: "#283552" },
  principle:  { fill: "#6b4535", stroke: "#523428" },
  index:      { fill: "#5f5e5a", stroke: "#4a4944" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  foundation: "Foundation",
  domain: "Domain",
  protocol: "Protocol",
  principle: "Principle",
};
