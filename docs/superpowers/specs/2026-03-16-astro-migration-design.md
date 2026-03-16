# Astro Migration with Obsidian-Compatible Wikilinks

**Status:** Approved
**Date:** 2026-03-16

---

## Goal

Migrate from Vite + React SPA to Astro. Move all prose content out of JSX into Markdown files. Add wikilink (`[[Page Name]]`) support so the content directory doubles as an Obsidian vault.

---

## Content Architecture

### Entry note (`index.md`)

The hub page. Each line is a wikilink; read together they form the argument:

```md
[[Fabric is a web of relationships]].
[[Agency in relationship builds collective power]].
[[Participating means enacting protocols]].
[[Every protocol has three layers]].
[[Protocol design is governed by seven principles]].
[[Protocol stewardship is distributed]].
[[The ecosystem needs to embody a generative cycle]].
[[We design for specific failure modes]].
```

### Note files

| # | Title (= filename stem) | Extension | Diagram |
|---|------------------------|-----------|---------|
| 1 | Fabric is a web of relationships | `.md` | — |
| 2 | Agency in relationship builds collective power | `.md` | — |
| 3 | Participating means enacting protocols | `.mdx` | `NetworkDiagram` |
| 4 | Every protocol has three layers | `.mdx` | `ThreeLayersDiagram` |
| 5 | Protocol design is governed by seven principles | `.md` | — |
| 6 | Protocol stewardship is distributed | `.md` | — |
| 7 | The ecosystem needs to embody a generative cycle | `.mdx` | `GenerativeCycleDiagram` |
| 8 | We design for specific failure modes | `.md` | — |

Filenames use the title with spaces (e.g., `Fabric is a web of relationships.md`). This matches Obsidian's native wikilink resolution — `[[Fabric is a web of relationships]]` resolves to `Fabric is a web of relationships.md` without configuration. The `remark-wiki-link` pageResolver slugifies for URL generation at build time.

### Frontmatter schema

Every note has:

```yaml
---
title: "Fabric is a web of relationships"
order: 1
description: "One-line summary for meta tags"
---
```

`order` drives prev/next navigation and the sequence on the entry page. The `index.md` hub note has `order: 0` and is rendered by `notes/index.astro` directly; the `[...slug].astro` dynamic route excludes it.

---

## Technical Stack

| Concern | Tool |
|---------|------|
| Framework | Astro v5 (uses `src/content.config.ts` for collection schemas) |
| Content | Astro Content Collections (`.md` + `.mdx`) |
| Islands | `@astrojs/react` for diagram components |
| MDX | `@astrojs/mdx` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (Astro uses Vite under the hood) |
| Wikilinks | `remark-wiki-link` |
| Deployment | GitHub Pages (existing workflow, updated for Astro) |

### Directory structure

```
astro.config.mjs
src/
  content/
    notes/                          ← Obsidian vault root
      index.md
      Fabric is a web of relationships.md
      Agency in relationship builds collective power.md
      Participating means enacting protocols.mdx
      Every protocol has three layers.mdx
      Protocol design is governed by seven principles.md
      Protocol stewardship is distributed.md
      The ecosystem needs to embody a generative cycle.mdx
      We design for specific failure modes.md
  content.config.ts                  ← collection schema (Astro v5 location)
  components/
    diagrams/
      NetworkDiagram.jsx            ← interactive d3 force graph (React island)
      ThreeLayersDiagram.jsx        ← static SVG (React component)
      GenerativeCycleDiagram.jsx    ← static SVG (React component)
  layouts/
    NoteLayout.astro                ← article chrome, nav, back-to-index link
  pages/
    index.astro                     ← meta-refresh redirect to /notes/
    notes/
      index.astro                   ← renders the entry note
      [...slug].astro               ← dynamic route for all other notes
  styles/
    global.css                      ← Tailwind import + CSS custom properties
.github/
  workflows/
    deploy.yml                      ← updated for Astro build
```

---

## Wikilinks

**Plugin:** `remark-wiki-link`

**Configuration:**

```js
{
  pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, '-')],
  hrefTemplate: (slug) => `/relational-protocols/notes/${slug}/`,
  aliasDivider: '|'
}
```

- `[[Page Name]]` → `<a href="/relational-protocols/notes/page-name/">Page Name</a>`
- `[[Page Name|display text]]` → `<a href="/relational-protocols/notes/page-name/">display text</a>`
- Applied to both `.md` and `.mdx` via Astro's unified remark pipeline.
- In Obsidian: wikilinks are native syntax — no configuration needed on that side.

---

## Diagram Components

All three diagrams are ported from the current `FabricProtocolArchitecture.jsx` with minimal changes. The `protocols`, `networkNodes`, and `pMap` data constants are co-located in `NetworkDiagram.jsx`.

1. **`NetworkDiagram.jsx`** — interactive d3 force-directed graph. Uses `client:load` because it needs JS immediately for the force simulation. Hover tooltips, protocol legend included.
2. **`ThreeLayersDiagram.jsx`** — static SVG showing Interface/Practice/Orientation layers. Uses `client:load` for porting simplicity (no interactivity but kept as React for consistency with the other diagrams).
3. **`GenerativeCycleDiagram.jsx`** — static SVG showing Commitment → Interdependence → Trust cycle. Includes the `CycleLabelBg` helper. Uses `client:load` for porting simplicity.

Each is imported in its respective `.mdx` file:

```mdx
---
title: "Participating means enacting protocols"
order: 3
description: "Membership is defined by which protocol clusters an agent adopts"
---

Content before diagram...

import NetworkDiagram from '../../components/diagrams/NetworkDiagram.jsx';

<NetworkDiagram client:load />

*Hover over nodes to see adopted protocols. Layout follows connection density.*

Content after diagram...
```

---

## Layout and Navigation

**`NoteLayout.astro`** provides:

- `<article>` wrapper with `max-w-2xl mx-auto px-4 py-10` (matching current styling)
- Page title as `<h1>`
- Back link to the entry note
- Prev/next navigation based on `order` frontmatter
- CSS custom properties carried over from current `index.css`

**Entry page** (`notes/index.astro`):

- Renders the hub note's markdown (the wikilink spine)
- Includes the subtitle/description from the current header
- No prev/next nav (it's the hub)

---

## Obsidian Compatibility

- **Vault root:** `src/content/notes/` — point Obsidian at this directory
- **`.md` files:** fully native
- **`.mdx` files:** enable "Detect all file extensions" in Obsidian Settings → Files & Links. Component tags (`<NetworkDiagram client:load />`) and import statements display as inert text in Obsidian — descriptive, harmless
- **Wikilinks:** native Obsidian syntax, resolved by `remark-wiki-link` at build time
- **New notes:** create `.md` files in Obsidian, add wikilinks from existing notes, and they'll be picked up by Astro's content collection on next build

---

## Deployment

Update `.github/workflows/deploy.yml`:

- Replace `npm run build` (Vite) with Astro's build command
- Output directory remains `dist` (Astro default)
- Base path `/relational-protocols/` configured in `astro.config.mjs`
- No other workflow changes needed

---

## What Gets Deleted

- `index.html` (Astro generates its own)
- `src/main.jsx` (Astro entry point replaces this)
- `src/FabricProtocolArchitecture.jsx` (content moves to Markdown, diagrams to components)
- `vite.config.js` (replaced by `astro.config.mjs`)
- Vite/React dependencies from `package.json` (replaced by Astro equivalents)

---

## What Gets Preserved

- All prose content (extracted from JSX into Markdown)
- All three diagram components (ported to standalone React components)
- Tailwind CSS styling and CSS custom properties
- GitHub Pages deployment pipeline
- The two existing docs in `docs/` (unchanged)
