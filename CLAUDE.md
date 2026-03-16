# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the design documents and interactive visualization for **Fabric's relational protocol architecture** — a proposal for organizing a network of social change agents through freely adopted relational protocols rather than traditional hierarchical structures.

The project is authored by Wolfgang Wopperer with synthesis support from Claude.

## Commands

- `npm run dev` — Start local dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally

Deployment to GitHub Pages happens automatically on push to `main` via `.github/workflows/deploy.yml`.

## Repository Structure

- `src/content/notes/` — Markdown/MDX content files (also an Obsidian vault). Each note is a page. Wikilinks (`[[Page Name]]`) are resolved by `remark-wiki-link` at build time. Filenames use title case with spaces to match Obsidian's native wikilink resolution.
- `src/components/diagrams/` — Three React components used as Astro islands:
  - `NetworkDiagram.jsx` — Interactive d3 force-directed graph with hover tooltips (`client:load`)
  - `ThreeLayersDiagram.jsx` — Static SVG of the three-layer model (`client:load`)
  - `GenerativeCycleDiagram.jsx` — Static SVG of the generative cycle (`client:load`)
- `src/layouts/NoteLayout.astro` — Article layout with prev/next navigation
- `src/pages/` — Astro routes: root redirect, hub page (`notes/index.astro`), dynamic note route (`notes/[...slug].astro`)
- `src/content.config.ts` — Astro content collection schema (title, order, description)
- `astro.config.mjs` — Astro config with React, MDX, Tailwind v4, and remark-wiki-link
- `docs/` — Source design documents (unchanged)

## Technical Details

Astro v6 static site. Dependencies:
- **Astro** with `@astrojs/react` (islands) and `@astrojs/mdx`
- **React 19** + **react-dom** (for diagram components)
- **d3** (force simulation in NetworkDiagram)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **remark-wiki-link** (Obsidian-compatible `[[wikilinks]]`)
- CSS custom properties for theming (e.g., `--color-text-primary`, `--color-background-secondary`)

The `base` in `astro.config.mjs` is set to `/relational-protocols` for GitHub Pages.

Content uses Astro's content collections with the glob loader. Pure-text notes are `.md`; notes with diagram components are `.mdx`. Both support wikilinks.

## Key Domain Concepts

Every Fabric protocol has three inseparable layers:
1. **Interface** (technological register) — explicit agreements, version-controlled
2. **Practice** (ceremonial register) — embodied disciplines that make the interface real
3. **Orientation** (meta-relational register) — recurring inquiry about whether the protocol serves life or reproduces separation

Membership in the network is defined by which protocol clusters an agent adopts, not by position in a hierarchy. The network topology emerges from below.
