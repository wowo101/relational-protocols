# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the design documents and interactive visualization for **Fabric's relational protocol architecture** — a proposal for organizing a network of social change agents through freely adopted relational protocols rather than traditional hierarchical structures.

The project is authored by Wolfgang Wopperer with synthesis support from Claude.

## Repository Structure

- `fabric_protocol_architecture.jsx` — A standalone React component that renders the full architectural overview as an interactive article. Uses d3.js for a force-directed network diagram and Tailwind CSS for styling. Exports `FabricProtocolArchitecture` as default.
- `docs/Fabric_Relational_Protocols_Design_Exploration.md` — The comprehensive design exploration document (source material for the JSX visualization).
- `docs/protocol_practices_synthesis.md` — Synthesis document connecting philosophy, strategy, organizational design, and pedagogy.

## Technical Details

The JSX file is a single-file React component with no build configuration in this repo. It depends on:
- **React** (hooks: useState, useEffect, useRef, useCallback, useMemo)
- **d3** (force simulation for the network diagram)
- **Tailwind CSS** (utility classes throughout)
- CSS custom properties for theming (e.g., `--color-text-primary`, `--color-background-secondary`, `--color-border-tertiary`)

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
