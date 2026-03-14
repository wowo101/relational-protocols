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

- `src/FabricProtocolArchitecture.jsx` — Main React component rendering the full architectural overview as an interactive article. Uses d3.js for a force-directed network diagram and Tailwind CSS for styling. Exports `FabricProtocolArchitecture` as default.
- `src/main.jsx` — App entry point (renders FabricProtocolArchitecture into `#root`)
- `src/index.css` — Tailwind CSS import
- `docs/Fabric_Relational_Protocols_Design_Exploration.md` — The comprehensive design exploration document (source material for the JSX visualization).
- `docs/protocol_practices_synthesis.md` — Synthesis document connecting philosophy, strategy, organizational design, and pedagogy.

## Technical Details

Vite + React single-page app. Dependencies:
- **React 19** + **react-dom**
- **d3** (force simulation for the network diagram)
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- CSS custom properties for theming (e.g., `--color-text-primary`, `--color-background-secondary`, `--color-border-tertiary`)

The `base` in `vite.config.js` is set to `/relational-protocols/` for GitHub Pages.

The component contains three SVG diagram sub-components:
- `NetworkDiagram` — Interactive force-directed graph showing organizations and their shared protocol adoptions. Uses direct DOM manipulation for hover effects to avoid React re-render loops (especially in Firefox).
- `ThreeLayersDiagram` — Static SVG showing the Interface/Practice/Orientation layer model.
- `GenerativeCycleDiagram` — Static SVG showing the Commitment → Interdependence → Trust cycle.

## Key Domain Concepts

Every Fabric protocol has three inseparable layers:
1. **Interface** (technological register) — explicit agreements, version-controlled
2. **Practice** (ceremonial register) — embodied disciplines that make the interface real
3. **Orientation** (meta-relational register) — recurring inquiry about whether the protocol serves life or reproduces separation

Membership in the network is defined by which protocol clusters an agent adopts, not by position in a hierarchy. The network topology emerges from below.
