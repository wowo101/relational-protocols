# Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate from Vite + React SPA to Astro with content in Markdown files and wikilink support for Obsidian authoring.

**Architecture:** Astro v5 with content collections (mixed `.md` and `.mdx`). React islands for three diagram components via `@astrojs/react`. Wikilinks via `remark-wiki-link`. Tailwind v4 via `@tailwindcss/vite`.

**Tech Stack:** Astro 5, React 19, d3, Tailwind CSS v4, remark-wiki-link, MDX

**Spec:** `docs/superpowers/specs/2026-03-16-astro-migration-design.md`

---

## Chunk 1: Astro scaffold and configuration

### Task 1: Replace Vite with Astro

**Files:**
- Delete: `vite.config.js`
- Delete: `index.html`
- Delete: `src/main.jsx`
- Delete: `src/index.css`
- Create: `astro.config.mjs`
- Create: `src/styles/global.css`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Remove old Vite/React config files**

```bash
rm vite.config.js index.html src/main.jsx src/index.css
```

- [ ] **Step 2: Update package.json**

Replace the full contents with:

```json
{
  "name": "relational-protocols",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 3: Install Astro and integrations**

```bash
npm install astro @astrojs/react @astrojs/mdx react react-dom d3 remark-wiki-link
npm install -D @tailwindcss/vite tailwindcss
```

- [ ] **Step 4: Create `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://wowo101.github.io",
  base: "/relational-protocols",
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      [
        "remark-wiki-link",
        {
          pageResolver: (name) => [name.toLowerCase().replace(/\s+/g, "-")],
          hrefTemplate: (slug) => `/relational-protocols/notes/${slug}/`,
          aliasDivider: "|",
        },
      ],
    ],
  },
});
```

- [ ] **Step 5: Create `src/styles/global.css`**

```css
@import "tailwindcss";

:root {
  --color-text-primary: #2c2c2a;
  --color-text-secondary: #5f5e5a;
  --color-background-primary: #fff;
  --color-background-secondary: #f5f4ef;
  --color-border-secondary: #b4b2a9;
  --color-border-tertiary: #d3d1c7;
}
```

- [ ] **Step 6: Update `.gitignore`**

Append Astro-specific entries:

```
.astro
```

- [ ] **Step 7: Create content collection schema**

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/notes" }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    description: z.string(),
  }),
});

export const collections = { notes };
```

- [ ] **Step 8: Verify Astro installs and config parses**

```bash
npx astro check 2>&1 || true
```

This may warn about missing pages (expected — we haven't created them yet). It should NOT fail on config parsing.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Replace Vite scaffold with Astro v5 configuration"
```

---

## Chunk 2: Diagram components

### Task 2: Extract NetworkDiagram

**Files:**
- Create: `src/components/diagrams/NetworkDiagram.jsx`

- [ ] **Step 1: Create `src/components/diagrams/NetworkDiagram.jsx`**

Copy lines 1–177 from `src/FabricProtocolArchitecture.jsx` into a standalone file. This includes `protocols`, `pMap`, `networkNodes`, and the `NetworkDiagram` function. Change the function to a default export:

```jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

const protocols = [
  { id: "decision", label: "Decision-making", color: "#0F6E56" },
  { id: "resource", label: "Resource flow", color: "#534AB7" },
  { id: "conflict", label: "Conflict engagement", color: "#D85A30" },
  { id: "feedback", label: "Feedback & learning", color: "#185FA5" },
  { id: "care", label: "Care & support", color: "#993556" },
];
const pMap = Object.fromEntries(protocols.map((p) => [p.id, p]));

const networkNodes = [
  { id: "A", name: "Grassroots collective", adopted: ["decision", "resource", "conflict", "feedback", "care"] },
  { id: "B", name: "Housing cooperative", adopted: ["decision", "resource", "conflict", "feedback"] },
  { id: "C", name: "Mutual aid network", adopted: ["decision", "resource", "conflict", "care"] },
  { id: "D", name: "Climate action group", adopted: ["decision", "resource", "feedback", "care"] },
  { id: "E", name: "Workers' cooperative", adopted: ["decision", "resource", "conflict"] },
  { id: "F", name: "Community garden", adopted: ["decision", "feedback"] },
  { id: "G", name: "Tenants' union", adopted: ["decision", "care"] },
  { id: "H", name: "Education collective", adopted: ["decision", "resource", "feedback", "care"] },
  { id: "I", name: "Food sovereignty project", adopted: ["decision", "resource"] },
];

export default function NetworkDiagram() {
  // ... exact same body as lines 26–176 of FabricProtocolArchitecture.jsx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/diagrams/NetworkDiagram.jsx
git commit -m "Extract NetworkDiagram as standalone React component"
```

### Task 3: Extract ThreeLayersDiagram

**Files:**
- Create: `src/components/diagrams/ThreeLayersDiagram.jsx`

- [ ] **Step 1: Create `src/components/diagrams/ThreeLayersDiagram.jsx`**

```jsx
export default function ThreeLayersDiagram() {
  // ... exact same body as lines 180–203 of FabricProtocolArchitecture.jsx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/diagrams/ThreeLayersDiagram.jsx
git commit -m "Extract ThreeLayersDiagram as standalone React component"
```

### Task 4: Extract GenerativeCycleDiagram

**Files:**
- Create: `src/components/diagrams/GenerativeCycleDiagram.jsx`

- [ ] **Step 1: Create `src/components/diagrams/GenerativeCycleDiagram.jsx`**

Include the `CycleLabelBg` helper:

```jsx
function CycleLabelBg({ x, y, w, h }) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="3" fill="var(--color-background-primary, #fff)" />;
}

export default function GenerativeCycleDiagram() {
  // ... exact same body as lines 210–257 of FabricProtocolArchitecture.jsx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/diagrams/GenerativeCycleDiagram.jsx
git commit -m "Extract GenerativeCycleDiagram as standalone React component"
```

---

## Chunk 3: Content extraction into Markdown

### Task 5: Create entry note and pure-Markdown notes (1, 2, 5, 6, 8)

**Files:**
- Create: `src/content/notes/index.md`
- Create: `src/content/notes/Fabric is a web of relationships.md`
- Create: `src/content/notes/Agency in relationship builds collective power.md`
- Create: `src/content/notes/Protocol design is governed by seven principles.md`
- Create: `src/content/notes/Protocol stewardship is distributed.md`
- Create: `src/content/notes/We design for specific failure modes.md`

- [ ] **Step 1: Create `src/content/notes/index.md`**

```md
---
title: "A relational protocol architecture for Fabric"
order: 0
description: "A brief overview offered as a contribution to collective thinking"
---

*A brief overview. This document is offered as a contribution to collective thinking, not as a finished design. It holds questions alongside proposals and expects to be changed by the relationships it enters.*

[[Fabric is a web of relationships]].
[[Agency in relationship builds collective power]].
[[Participating means enacting protocols]].
[[Every protocol has three layers]].
[[Protocol design is governed by seven principles]].
[[Protocol stewardship is distributed]].
[[The ecosystem needs to embody a generative cycle]].
[[We design for specific failure modes]].

---

*This overview synthesises the fuller design exploration. It is a working document inviting revision, with open questions preserved in the source material.*
```

- [ ] **Step 2: Create `Fabric is a web of relationships.md`**

Extract prose from JSX lines 282–283:

```md
---
title: "Fabric is a web of relationships"
order: 1
description: "The network's topology emerges from commitments its members actually enact"
---

Fabric is, first and foremost, a web of relationships between agents for social change. Its purpose – building collective power in the service of life – is not achieved by designing a structure from above but by cultivating a pattern of *right relations* from below. The network has no fixed shape; its topology emerges from the commitments its members actually enact.

The unit of design is therefore not the organisation chart or the governance body but the *relational protocol*: a freely adopted agreement about how to be in relationship – how to make decisions together, share resources, hold conflict, learn.
```

- [ ] **Step 3: Create `Agency in relationship builds collective power.md`**

Extract from JSX lines 287–290:

```md
---
title: "Agency in relationship builds collective power"
order: 2
description: "People are changed by the relationships they are in, and they change those relationships"
---

People are changed by the relationships they are in, and they change those relationships. Adopting a protocol is an act of agency; living it transforms both the adopter and the relationship. This has two faces, and both constitute Fabric's contribution to dual power:

*Inward:* Deeper relationships foster alternative institutions – circles of mutual aid, cooperative resource flows, shared governance – that embody different ways of being together.

*Outward:* Shared protocols create the conditions for coordinated collective action – the capacity to mobilise resources, align strategy, and exercise collective force when needed.

Collective agency emerges not through coordination from above but through the accumulation and interconnection of committed relationships.
```

- [ ] **Step 4: Create `Protocol design is governed by seven principles.md`**

Extract from JSX lines 311–318. Convert `<Principle>` components to Markdown definition-style formatting:

```md
---
title: "Protocol design is governed by seven principles"
order: 5
description: "Principles that apply whenever protocols are being designed, assessed, or revised"
---

These principles apply whenever protocols are being designed, assessed, or revised.

**Interrupt separation at the level of structure.** A protocol that only specifies rules will produce bureaucracy; one that only cultivates practices will produce good intentions without accountability. Requiring all three layers – interface, practice, and orientation – in every protocol is what makes the interruption of separation structural rather than aspirational. A protocol missing any layer cannot be adopted.

**Design for asymmetry.** Aspiration doesn't produce equity; structure does. Build explicit structural mechanisms into the interface layer of every protocol: inverse weighting (smaller organisations' voices count more, not less), caps on accumulation (no agent holds mandates across too many domains), mandatory "who is not in the room" checks before network-wide decisions, collective pre-emptive boundary-setting, and automatic redistribution triggers when accumulation exceeds consent-defined thresholds.

**Make voice cheap.** Three-layer governance is inherently costly – meetings, consent rounds, orientation inquiries. Without active design, this cost self-selects for the resourced. So design every protocol with this in mind: make asynchronous participation first-class, provide multiple channels for raising objections, build in objection support, fund participation budgets from solidarity contributions, and commit to response times that make raising concerns feel worthwhile.

**Design for scale.** Shared protocols create interoperability: agents who adopt the same protocol can act together even without direct relationship. Design protocols so they work between strangers, not only between friends. This is what enables the network to grow beyond the trust radius of any single relationship – and it is what distinguishes a protocol architecture from a community of practice. At the same time, build in federation and mitosis mechanisms before they are needed, so that growth produces distributed capacity rather than centralised coordination.

**Listen and adapt.** Every protocol carries built-in review dates and evolution criteria. Treat the first version of any protocol as a hypothesis, not a settlement. The orientation layer exists precisely to surface what isn't working – but only if the network actually acts on what it learns. Design feedback pathways that are short enough to be responsive and visible enough that adaptation is the norm, not the exception.

**Start with simple rules.** The entire design rests on a small set of conceptual tools – relational protocols with three layers, voluntary adoption with consequence, shared commitments as a normative floor. From these, arbitrarily complex network structures can emerge bottom-up, without top-down determination. Resist the urge to pre-specify more than is needed.

**Target documented failure modes.** Every structural mechanism – rotation, caps, redistribution triggers, stewardship pairs, participation budgets – should target a specific, empirically observed failure pattern, not a theoretical risk. Design against what has actually gone wrong in comparable networks.
```

- [ ] **Step 5: Create `Protocol stewardship is distributed.md`**

Extract from JSX lines 322–327. Convert `<GovItem>` components to Markdown:

```md
---
title: "Protocol stewardship is distributed"
order: 6
description: "How protocols are created, adopted, evolved, and tended"
---

**Shared commitments.** All protocols must serve a small set of collectively derived commitments, including an explicit reckoning with racialisation, colonialism, and extractive domination as foundational structures Fabric exists within. The precise formulation is to be developed collectively.

**Creating protocols.** New protocols are proposed in response to identified needs. Before adoption, every protocol passes an asymmetry check (who benefits, who is burdened, whose ways of knowing are privileged), a narrative check (which experiences does this enable, which narrative does it amplify?), a three-layer completeness check, and a consent round among those affected. Built-in review dates and evolution criteria are mandatory.

**Adopting and evolving protocols.** Protocols are adopted voluntarily but with consequence: adopting a cluster constitutes membership. Protocols evolve through consent, with changes communicated to all adopters and transition periods for adaptation.

**Distributing stewardship.** Invisible coordination labour concentrated in the most committed is the paradigmatic failure mode for distributed networks. Specify stewardship requirements in every protocol: what tending it needs, by whom, for how long. Rotate stewardship with the review cycle, cap individual loads, hold every function in pairs from different organisations, track stewardship as a contribution, and fund it from the shared resource pool.

**The wisdom function.** A dedicated function periodically examines the protocol ecosystem: are protocols proliferating unsustainably? Are they drifting from shared commitments? Are orientation layers actually being practised? Where are dark economies forming? This function is itself protected from becoming a power centre through rotation, mandate limits, and accountability to the wider network.

**Adaptive governance.** Drawing on the observation that many pre-state societies deliberately shifted governance modes by context, the protocol architecture includes a defined crisis mode: trigger conditions defined in advance by consent, time-bounded authority with hard expiry, scope-bounded to the stated crisis, mandatory post-crisis review, and automatic redistribution of any authority, resources, or information that concentrated during the crisis. These are interface-level safeguards, not orientation aspirations.
```

- [ ] **Step 6: Create `We design for specific failure modes.md`**

Extract from JSX lines 342–343:

```md
---
title: "We design for specific failure modes"
order: 8
description: "The architecture targets empirically documented failure patterns"
---

The architecture is designed around empirically documented failure patterns from comparable networks and movements: invisible labour concentration burning out the most committed while the network believes it distributes power; intermediate coordinating structures accumulating their own interests and becoming obstacles to participation; two-tier membership creating insiders and outsiders; protocol-level decentralisation failing to prevent power re-concentration.

Each structural mechanism targets a specific, observed failure mode rather than a theoretical risk. The orientation layer of every protocol exists precisely to make emerging problems visible – whose conflicts are processed and whose aren't, where resources are concentrating, whether stewardship is actually distributed or just formally shared. The architecture is itself a learning system: the first cycle is data, not verdict.
```

- [ ] **Step 7: Commit**

```bash
git add src/content/notes/
git commit -m "Add entry note and five pure-Markdown content notes"
```

### Task 6: Create MDX notes with diagram imports (3, 4, 7)

**Files:**
- Create: `src/content/notes/Participating means enacting protocols.mdx`
- Create: `src/content/notes/Every protocol has three layers.mdx`
- Create: `src/content/notes/The ecosystem needs to embody a generative cycle.mdx`

- [ ] **Step 1: Create `Participating means enacting protocols.mdx`**

Extract from JSX lines 294–297:

```mdx
---
title: "Participating means enacting protocols"
order: 3
description: "Membership is defined by which protocol clusters an agent adopts"
---

import NetworkDiagram from '../../components/diagrams/NetworkDiagram.jsx';

You are "in" the network by virtue of the protocols you've adopted. A minimal cluster – perhaps consent-based decision-making, a solidarity contribution, and a feedback practice – constitutes basic membership. Deeper involvement means adopting more protocols. Specific roles carry specific protocol sets. The result is a topology of shared commitments, shaped by patterns of protocol adoption.

The network's shape emerges from below. Different members adopt different protocol clusters, creating a web where some connections are dense (many shared protocols) and others thinner (only the minimal set). No central authority determines the topology – it is the aggregate of freely adopted commitments.

<NetworkDiagram client:load />

*Hover over nodes to see adopted protocols. Layout follows connection density.*
```

- [ ] **Step 2: Create `Every protocol has three layers.mdx`**

Extract from JSX lines 301–307:

```mdx
---
title: "Every protocol has three layers"
order: 4
description: "Interface, practice, and orientation – inseparable aspects of every commitment structure"
---

import ThreeLayersDiagram from '../../components/diagrams/ThreeLayersDiagram.jsx';

A protocol that only specifies rules of interaction will, over time, produce bureaucracy. A protocol that only cultivates relational practices will produce good intentions without accountability. And a protocol that coordinates effectively but never asks *whose interests it serves* will reproduce the very patterns of separation it was meant to interrupt. This is why every Fabric protocol must operate at all three of the following layers simultaneously – not as stages of development, but as inseparable aspects of what it means to inhabit a commitment structure.

<ThreeLayersDiagram client:load />

**Interface** (technological register): the explicit agreement governing how participants meet each other – clear, version-controlled, accountable. *Example: decisions pass by consent unless someone raises a reasoned objection.*

**Practice** (ceremonial register): the embodied discipline that makes the interface real – what you do regularly, with your whole self, that cultivates the relational capacity the interface depends on. *Example: somatic check-ins during consent rounds, treating body signals as information alongside analytical reasoning.*

**Orientation** (meta-relational register): the recurring inquiry that keeps the protocol honest – the questions you ask together about whether it is serving life or reproducing separation. *Example: at each review, examine whose objections have been raised and whose have not, what structural conditions make objecting difficult.*

The three registers draw on distinct traditions: the technological register from computing's interoperability agreements; the ceremonial from diplomacy and indigenous governance; and the meta-relational from the work of the Gesturing Towards Decolonial Futures (GTDF) collective and the Meta-Relationality Institute (MRI), particularly Vanessa Machado de Oliveira's framing of relational protocols as containers for being-together-across-difference – not aiming for consensus but for relational coherence, and designing explicitly for asymmetry of position, exposure, and risk. The orientation layer is where this inheritance is most direct: its insistence on asking whose interests a protocol serves and whose ways of knowing it privileges is a structural expression of the GTDF/MRI commitment to interrupting the reproduction of colonial and extractive logics within the very structures meant to resist them.

The inseparability of the three layers is the non-optional design feature that structurally requires the interruption of separation logic.
```

- [ ] **Step 3: Create `The ecosystem needs to embody a generative cycle.mdx`**

Extract from JSX lines 331–338:

```mdx
---
title: "The ecosystem needs to embody a generative cycle"
order: 7
description: "Commitment → Interdependence → Trust → deeper Commitment"
---

import GenerativeCycleDiagram from '../../components/diagrams/GenerativeCycleDiagram.jsx';

The architecture's viability rests on a cycle at the level of participant experience:

> *Commitment* (adopting protocols, contributing time and resources) → *Interdependence* (getting something you can't get alone – mutual aid, coordinated action, shared learning) → *Trust* (relationships deepen through practice and orientation work) → deeper *Commitment*.

<GenerativeCycleDiagram client:load />

The material mechanisms – participation budgets, solidarity contributions, resource flows, distributed stewardship – are design requirements for keeping each transition healthy. They enable the cycle but are not the cycle itself.

If commitment doesn't produce interdependence – if the network isn't materially useful – people drift away. If interdependence doesn't deepen trust – if relationships stay transactional – the network plateaus at coordination without collective agency. If trust doesn't lead to deeper commitment – if people value the relationships but don't adopt further protocols – the network remains a community of practice rather than a collective agent. Each transition can stall, and each stall has a different design response.

This is why resource flows are not secondary but foundational: they are the primary mechanism through which commitment becomes interdependence. And it is why the orientation layer matters: it is the primary mechanism through which interdependence becomes trust rather than mere mutual convenience.
```

- [ ] **Step 4: Commit**

```bash
git add src/content/notes/
git commit -m "Add three MDX notes with diagram island imports"
```

---

## Chunk 4: Layouts and pages

### Task 7: Create NoteLayout

**Files:**
- Create: `src/layouts/NoteLayout.astro`

- [ ] **Step 1: Create `src/layouts/NoteLayout.astro`**

```astro
---
import "../styles/global.css";

const { title, order, allNotes } = Astro.props;

const sorted = allNotes
  .filter((n) => n.data.order > 0)
  .sort((a, b) => a.data.order - b.data.order);

const currentIndex = sorted.findIndex((n) => n.data.order === order);
const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
const next = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

function noteHref(note) {
  const slug = note.id.replace(/\.(md|mdx)$/, "").toLowerCase().replace(/\s+/g, "-");
  return `${import.meta.env.BASE_URL}notes/${slug}/`;
}
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} – Fabric</title>
  </head>
  <body>
    <article
      class="max-w-2xl mx-auto px-4 py-10 text-base"
      style={{ color: "var(--color-text-primary, #2c2c2a)" }}
    >
      <header class="mb-10">
        <a
          href={`${import.meta.env.BASE_URL}notes/`}
          class="text-sm opacity-50 hover:opacity-80 mb-4 inline-block"
          >&larr; Overview</a
        >
        <h1 class="text-2xl font-medium tracking-tight">{title}</h1>
      </header>

      <section class="mb-12 leading-relaxed prose-content">
        <slot />
      </section>

      <nav
        class="mt-16 pt-6 border-t flex justify-between text-sm"
        style={{ borderColor: "var(--color-border-tertiary, #d3d1c7)" }}
      >
        {prev ? (
          <a href={noteHref(prev)} class="opacity-60 hover:opacity-100">
            &larr; {prev.data.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={noteHref(next)} class="opacity-60 hover:opacity-100 text-right">
            {next.data.title} &rarr;
          </a>
        ) : (
          <span />
        )}
      </nav>
    </article>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/NoteLayout.astro
git commit -m "Add NoteLayout with prev/next navigation"
```

### Task 8: Create page routes

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/notes/index.astro`
- Create: `src/pages/notes/[...slug].astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

Meta-refresh redirect to `/relational-protocols/notes/`:

```astro
---
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="refresh"
      content={`0;url=${import.meta.env.BASE_URL}notes/`}
    />
    <title>Redirecting…</title>
  </head>
  <body>
    <p>
      Redirecting to <a href={`${import.meta.env.BASE_URL}notes/`}>notes</a>…
    </p>
  </body>
</html>
```

- [ ] **Step 2: Create `src/pages/notes/index.astro`**

Renders the hub/entry note:

```astro
---
import "../../styles/global.css";
import { getCollection } from "astro:content";

const allNotes = await getCollection("notes");
const entry = allNotes.find((n) => n.data.order === 0);
if (!entry) throw new Error("Missing index note (order: 0)");
const { Content } = await entry.render();
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>A relational protocol architecture for Fabric</title>
  </head>
  <body>
    <article
      class="max-w-2xl mx-auto px-4 py-10 text-base"
      style={{ color: "var(--color-text-primary, #2c2c2a)" }}
    >
      <header class="mb-10">
        <h1 class="text-3xl font-medium tracking-tight mb-3">
          A relational protocol architecture for Fabric
        </h1>
      </header>

      <section class="leading-relaxed prose-content">
        <Content />
      </section>

      <footer
        class="mt-16 pt-6 border-t text-sm opacity-50 italic"
        style={{ borderColor: "var(--color-border-tertiary, #d3d1c7)" }}
      >
        This overview synthesises the fuller design exploration. It is a working
        document inviting revision, with open questions preserved in the source
        material.
      </footer>
    </article>
  </body>
</html>
```

- [ ] **Step 3: Create `src/pages/notes/[...slug].astro`**

Dynamic route for all notes except the index:

```astro
---
import { getCollection } from "astro:content";
import NoteLayout from "../../layouts/NoteLayout.astro";

export async function getStaticPaths() {
  const notes = await getCollection("notes");
  return notes
    .filter((n) => n.data.order > 0)
    .map((note) => {
      const slug = note.id
        .replace(/\.(md|mdx)$/, "")
        .toLowerCase()
        .replace(/\s+/g, "-");
      return { params: { slug }, props: { note } };
    });
}

const { note } = Astro.props;
const allNotes = await getCollection("notes");
const { Content } = await note.render();
---

<NoteLayout title={note.data.title} order={note.data.order} allNotes={allNotes}>
  <Content />
</NoteLayout>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/
git commit -m "Add page routes: root redirect, hub page, dynamic note pages"
```

---

## Chunk 5: Cleanup, deployment, and verification

### Task 9: Delete old source files

**Files:**
- Delete: `src/FabricProtocolArchitecture.jsx`

- [ ] **Step 1: Delete the old monolithic component**

```bash
rm src/FabricProtocolArchitecture.jsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "Remove old Vite+React SPA source files"
```

### Task 10: Update GitHub Actions workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Update deploy.yml**

Replace the `node-version` and `build` step. The workflow should look like:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

Only change: `node-version: 20` → `node-version: 22` (Astro v5 requires Node 22+).

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Update deploy workflow for Astro (Node 22)"
```

### Task 11: Build and verify

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: clean build, output in `dist/`. Should see pages generated for each note.

- [ ] **Step 2: Preview locally**

```bash
npm run preview
```

Open `http://localhost:4321/relational-protocols/` in browser. Verify:
- Root redirects to `/relational-protocols/notes/`
- Hub page shows the wikilink spine as clickable links
- Each note page renders its content with prev/next navigation
- The three diagram pages render their interactive/static SVG diagrams
- NetworkDiagram hover tooltips work
- Back-to-overview link works on each page

- [ ] **Step 3: Fix any issues found during verification**

- [ ] **Step 4: Final commit if fixes were needed**

```bash
git add -A
git commit -m "Fix issues found during build verification"
```

### Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect the new architecture**

Update the "Repository Structure", "Technical Details", and "Commands" sections to describe the Astro setup, content collection, and diagram components instead of the old Vite+React SPA.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for Astro migration"
```
