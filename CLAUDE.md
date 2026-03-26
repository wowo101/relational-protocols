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

Every Fabric protocol has three inseparable layers (ARC):
1. **Accord** (technological register) — explicit agreements, version-controlled
2. **Ritual** (ceremonial register) — embodied disciplines that make the accord real
3. **Compass** (meta-relational register) — recurring inquiry about whether the protocol serves life or reproduces separation

Membership in the network is defined by which protocol clusters an agent adopts, not by position in a hierarchy. The network topology emerges from below.

## Note Ordering

Notes use a spaced `order` field (frontmatter) for prev/next navigation. Values are spaced by 10 so new notes can be inserted without renumbering existing ones.

| Range | Section |
|-------|---------|
| 10–80 | Core narrative (8 notes) |
| 100–170 | Foundations |
| 180–240 | Protocol areas |
| 250–290 | Decision protocols |
| 300–320 | Conflict protocols |
| 330–390 | Design principles |
| 400 | Protocols overview |
| 900+ | Special pages (Glossary, Sources) |

To insert a note between order 150 and 160, use 155. The code filters out `order === 0` (Index) and `order >= 900` (special pages) from the graph and navigation.

## Content Conventions

### Sources
- **No inline citations** in body text. Do not use `(Author Year)` parenthetical references.
- Author names may appear naturally in prose (e.g., "Sawyer identifies…", "Sarri names…") but without year/parenthetical.
- All sources go in a `## Sources` section at the end of each note.
- Source format: `- [topic] (adapted) from Author (Year), *Title*` — lead with what the note draws from the source, then cite it.
- Examples:
  - `- Consent process sequence adapted from Bockelbrink, Priest & David (2019), *Sociocracy 3.0 — A Practical Guide*`
  - `- Collaborative emergence theory from Sawyer (2005), *Social Emergence*`
