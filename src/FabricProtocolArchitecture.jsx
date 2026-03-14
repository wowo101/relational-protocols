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

function NetworkDiagram() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const hoveredRef = useRef(null);
  const rafRef = useRef(null);
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    const W = 680, H = 520, R = 22;
    const nodes = networkNodes.map((n) => ({ ...n }));
    const links = [];
    const linkCounts = {};
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].adopted.filter((p) => nodes[j].adopted.includes(p));
        const k = nodes[i].id + "-" + nodes[j].id;
        linkCounts[k] = shared.length;
        shared.forEach((p, idx) => {
          links.push({ source: nodes[i].id, target: nodes[j].id, protocol: p, offset: idx, total: shared.length });
        });
      }
    }
    const sim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-900))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(R + 20))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(H / 2).strength(0.04))
      .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => {
        const k = [d.source.id || d.source, d.target.id || d.target].sort().join("-");
        return 300 - (linkCounts[k] || 1) * 40;
      }).strength((d) => {
        const k = [d.source.id || d.source, d.target.id || d.target].sort().join("-");
        return 0.08 + (linkCounts[k] || 1) * 0.06;
      }));
    for (let i = 0; i < 400; i++) sim.tick();
    sim.stop();
    nodes.forEach((d) => {
      d.x = Math.max(R + 10, Math.min(W - R - 10, d.x));
      d.y = Math.max(R + 20, Math.min(H - R - 10, d.y));
    });
    const resolvedLinks = links.map((l) => {
      const s = typeof l.source === "object" ? l.source : nodes.find((n) => n.id === l.source);
      const t = typeof l.target === "object" ? l.target : nodes.find((n) => n.id === l.target);
      const dx = t.x - s.x, dy = t.y - s.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
      const spread = 4, off = (l.offset - (l.total - 1) / 2) * spread;
      const nx = -dy / len, ny = dx / len;
      return { ...l, x1: s.x + nx * off, y1: s.y + ny * off, x2: t.x + nx * off, y2: t.y + ny * off, sid: s.id, tid: t.id };
    });
    setPositions({ nodes, links: resolvedLinks });
  }, []);

  // Clean up any pending animation frame on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Apply hover highlight via direct DOM manipulation – avoids re-rendering
  // all SVG elements, which in Firefox triggers spurious mouse boundary
  // events and creates an enter/leave/enter infinite loop.
  const applyHoverEffect = useCallback((nodeId) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.querySelectorAll("line[data-link]").forEach((el) => {
      const sid = el.getAttribute("data-sid");
      const tid = el.getAttribute("data-tid");
      el.setAttribute("opacity",
        nodeId ? ((sid === nodeId || tid === nodeId) ? "0.8" : "0.1") : "0.45"
      );
    });
    svg.querySelectorAll("g[data-nid] > circle:first-child").forEach((el) => {
      const nid = el.parentElement.getAttribute("data-nid");
      el.setAttribute("stroke-width", nid === nodeId ? "1.5" : "0.5");
    });
  }, []);

  const handleMouseEnter = useCallback((n, e) => {
    hoveredRef.current = n.id;
    applyHoverEffect(n.id);
    const r = containerRef.current?.getBoundingClientRect();
    if (r) setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top, node: n });
  }, [applyHoverEffect]);

  // Throttle tooltip repositioning to one update per animation frame
  const handleMouseMove = useCallback((e) => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = containerRef.current?.getBoundingClientRect();
      if (r && hoveredRef.current) {
        setTooltip((t) => t ? { ...t, x: e.clientX - r.left, y: e.clientY - r.top } : null);
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    applyHoverEffect(null);
    setTooltip(null);
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, [applyHoverEffect]);

  // Memoize the SVG content so that tooltip state changes (which only
  // affect the absolutely-positioned overlay div) never re-render the graph.
  const svgContent = useMemo(() => {
    if (!positions) return null;
    return (
      <svg ref={svgRef} viewBox="0 0 680 520" className="w-full">
        {positions.links.map((l, i) => (
          <line key={i} data-link data-sid={l.sid} data-tid={l.tid}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={pMap[l.protocol].color} strokeWidth={1.2} opacity={0.45} />
        ))}
        {positions.nodes.map((n) => {
          const dotR = 3, gap = dotR * 2 + 2, totalW = (n.adopted.length - 1) * gap;
          return (
            <g key={n.id} data-nid={n.id} transform={`translate(${n.x},${n.y})`}
              onMouseEnter={(e) => handleMouseEnter(n, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="cursor-default">
              <circle r={22} fill="var(--color-background-secondary, #f5f4ef)" stroke="var(--color-border-secondary, #b4b2a9)" strokeWidth={0.5} />
              {n.adopted.map((p, i) => (<circle key={p} cx={-totalW / 2 + i * gap} cy={0} r={dotR} fill={pMap[p].color} />))}
              <text y={-28} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--color-text-secondary, #5f5e5a)">{n.id}</text>
            </g>
          );
        })}
      </svg>
    );
  }, [positions, handleMouseEnter, handleMouseMove, handleMouseLeave]);

  if (!positions) return <div className="h-64 flex items-center justify-center text-sm opacity-50">Computing layout…</div>;
  return (
    <div className="relative my-6" ref={containerRef}>
      {svgContent}
      {tooltip && (
        <div className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs border z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10, background: "var(--color-background-secondary, #f5f4ef)", borderColor: "var(--color-border-tertiary, #d3d1c7)", color: "var(--color-text-primary, #2c2c2a)" }}>
          <div className="font-medium mb-1">{tooltip.node.name}</div>
          {tooltip.node.adopted.map((p) => (<span key={p} className="inline-block mr-1.5" style={{ color: pMap[p].color }}>{pMap[p].label}</span>))}
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs opacity-70">
        {protocols.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0 border-t-2" style={{ borderColor: p.color }} />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreeLayersDiagram() {
  return (
    <svg viewBox="0 0 680 300" className="w-full my-6">
      <rect x="40" y="20" width="340" height="260" rx="16" fill="#E1F5EE" stroke="#0F6E56" strokeWidth={0.5} />
      <rect x="60" y="42" width="300" height="56" rx="8" fill="#E6F1FB" stroke="#185FA5" strokeWidth={0.5} />
      <text x="210" y="62" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} fill="#0C447C">Interface</text>
      <text x="210" y="82" textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#185FA5">How we meet each other</text>
      <rect x="60" y="112" width="300" height="56" rx="8" fill="#EEEDFE" stroke="#534AB7" strokeWidth={0.5} />
      <text x="210" y="132" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} fill="#3C3489">Practice</text>
      <text x="210" y="152" textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#534AB7">What we do together</text>
      <rect x="60" y="182" width="300" height="56" rx="8" fill="#FAECE7" stroke="#993C1D" strokeWidth={0.5} />
      <text x="210" y="202" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={500} fill="#712B13">Orientation</text>
      <text x="210" y="222" textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#993C1D">Is this serving life?</text>
      <text x="210" y="262" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Inseparable – not stages</text>
      <text x="410" y="52" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Interface alone</text>
      <text x="412" y="68" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">= bureaucracy</text>
      <text x="410" y="122" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Interface + practice</text>
      <text x="412" y="138" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">= well-coordinated separation</text>
      <text x="410" y="192" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Practice alone</text>
      <text x="412" y="208" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">= good intentions, no accountability</text>
      <text x="410" y="256" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">All three together =</text>
      <text x="412" y="274" fontSize={14} fontWeight={500} fill="var(--color-text-primary, #2c2c2a)">structural interruption</text>
      <text x="412" y="292" fontSize={14} fontWeight={500} fill="var(--color-text-primary, #2c2c2a)">of separation</text>
    </svg>
  );
}

function CycleLabelBg({ x, y, w, h }) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="3" fill="var(--color-background-primary, #fff)" />;
}

function GenerativeCycleDiagram() {
  return (
    <svg viewBox="0 0 680 410" className="w-full my-6">
      <defs>
        <marker id="arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="arr-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="arr-coral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <circle cx="340" cy="195" r="140" fill="none" stroke="var(--color-border-tertiary, #d3d1c7)" strokeWidth={0.5} strokeDasharray="4 4" />

      <path d="M340 55 A140 140 0 0 1 461 265" fill="none" stroke="#534AB7" strokeWidth={1.8} markerEnd="url(#arr-purple)" />
      <path d="M461 265 A140 140 0 0 1 219 265" fill="none" stroke="#D85A30" strokeWidth={1.8} markerEnd="url(#arr-coral)" />
      <path d="M219 265 A140 140 0 0 1 340 55" fill="none" stroke="#0F6E56" strokeWidth={1.8} markerEnd="url(#arr-green)" />

      <text x="340" y="26" textAnchor="middle" fontSize={16} fontWeight={500} fill="var(--color-text-primary, #2c2c2a)">Commitment</text>
      <text x="340" y="44" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Adopting, contributing</text>

      <text x="545" y="288" textAnchor="middle" fontSize={16} fontWeight={500} fill="var(--color-text-primary, #2c2c2a)">Interdependence</text>
      <text x="545" y="306" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">What you can't get alone</text>

      <text x="170" y="288" textAnchor="middle" fontSize={16} fontWeight={500} fill="var(--color-text-primary, #2c2c2a)">Trust</text>
      <text x="170" y="306" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Relationships deepen</text>

      <CycleLabelBg x={488} y={138} w={120} h={50} />
      <text x="488" y="128" textAnchor="middle" fontSize={11} fill="#534AB7">Enabled by</text>
      <text x="488" y="142" textAnchor="middle" fontSize={11} fill="#534AB7">resource flows</text>
      <text x="488" y="160" textAnchor="middle" fontSize={10} fill="#534AB7" opacity={0.7}>Stalls: network isn't useful</text>

      <CycleLabelBg x={340} y={348} w={130} h={50} />
      <text x="340" y="338" textAnchor="middle" fontSize={11} fill="#D85A30">Enabled by</text>
      <text x="340" y="352" textAnchor="middle" fontSize={11} fill="#D85A30">orientation layers</text>
      <text x="340" y="370" textAnchor="middle" fontSize={10} fill="#D85A30" opacity={0.7}>Stalls: stays transactional</text>

      <CycleLabelBg x={192} y={138} w={140} h={50} />
      <text x="192" y="128" textAnchor="middle" fontSize={11} fill="#0F6E56">Enabled by protocol</text>
      <text x="192" y="142" textAnchor="middle" fontSize={11} fill="#0F6E56">interoperability</text>
      <text x="192" y="160" textAnchor="middle" fontSize={10} fill="#0F6E56" opacity={0.7}>Stalls: plateaus as CoP</text>

      <text x="340" y="400" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Each transition can stall. Each stall has a different design response.</text>
    </svg>
  );
}

function Section({ title, children }) {
  return (<section className="mb-12"><h2 className="text-xl font-medium mb-4 tracking-tight">{title}</h2>{children}</section>);
}
function P({ children }) {
  return <p className="mb-4 leading-relaxed">{children}</p>;
}
function Principle({ title, children }) {
  return (<div className="mb-5"><div className="font-medium mb-1">{title}</div><div className="leading-relaxed">{children}</div></div>);
}
function GovItem({ title, children }) {
  return (<div className="mb-4"><div className="font-medium mb-1">{title}</div><div className="leading-relaxed">{children}</div></div>);
}

export default function FabricProtocolArchitecture() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-10 text-base" style={{ color: "var(--color-text-primary, #2c2c2a)" }}>
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight mb-3">A relational protocol architecture for Fabric</h1>
        <p className="text-sm opacity-60 leading-relaxed italic">A brief overview. This document is offered as a contribution to collective thinking, not as a finished design. It holds questions alongside proposals and expects to be changed by the relationships it enters.</p>
      </header>

      <Section title="Fabric as a web of relationships">
        <P>Fabric is, first and foremost, a web of relationships between agents for social change. Its purpose – building collective power in the service of life – is not achieved by designing a structure from above but by cultivating a pattern of <em>right relations</em> from below. The network has no fixed shape; its topology emerges from the commitments its members actually enact.</P>
        <P>The unit of design is therefore not the organisation chart or the governance body but the <em>relational protocol</em>: a freely adopted agreement about how to be in relationship – how to make decisions together, share resources, hold conflict, learn.</P>
      </Section>

      <Section title="Agency in relationship as the theory of change">
        <P>People are changed by the relationships they are in, and they change those relationships. Adopting a protocol is an act of agency; living it transforms both the adopter and the relationship. This has two faces, and both constitute Fabric's contribution to dual power:</P>
        <P><em>Inward:</em> Deeper relationships foster alternative institutions – circles of mutual aid, cooperative resource flows, shared governance – that embody different ways of being together.</P>
        <P><em>Outward:</em> Shared protocols create the conditions for coordinated collective action – the capacity to mobilise resources, align strategy, and exercise collective force when needed.</P>
        <P>Collective agency emerges not through coordination from above but through the accumulation and interconnection of committed relationships.</P>
      </Section>

      <Section title="Membership as enacting sets of protocols">
        <P>You are "in" the network by virtue of the protocols you've adopted. A minimal cluster – perhaps consent-based decision-making, a solidarity contribution, and a feedback practice – constitutes basic membership. Deeper involvement means adopting more protocols. Specific roles carry specific protocol sets. The result is a topology of shared commitments, shaped by patterns of protocol adoption.</P>
        <P>The network's shape emerges from below. Different members adopt different protocol clusters, creating a web where some connections are dense (many shared protocols) and others thinner (only the minimal set). No central authority determines the topology – it is the aggregate of freely adopted commitments.</P>
        <NetworkDiagram />
        <p className="text-xs opacity-50 mb-2 -mt-4 text-center">Hover over nodes to see adopted protocols. Layout follows connection density.</p>
      </Section>

      <Section title="Three layers of every relational protocol">
        <P>A protocol that only specifies rules of interaction will, over time, produce bureaucracy. A protocol that only cultivates relational practices will produce good intentions without accountability. And a protocol that coordinates effectively but never asks <em>whose interests it serves</em> will reproduce the very patterns of separation it was meant to interrupt. This is why every Fabric protocol must operate at all three of the following layers simultaneously – not as stages of development, but as inseparable aspects of what it means to inhabit a commitment structure.</P>
        <ThreeLayersDiagram />
        <P><strong>Interface</strong> (technological register): the explicit agreement governing how participants meet each other – clear, version-controlled, accountable. <em>Example: decisions pass by consent unless someone raises a reasoned objection.</em></P>
        <P><strong>Practice</strong> (ceremonial register): the embodied discipline that makes the interface real – what you do regularly, with your whole self, that cultivates the relational capacity the interface depends on. <em>Example: somatic check-ins during consent rounds, treating body signals as information alongside analytical reasoning.</em></P>
        <P><strong>Orientation</strong> (meta-relational register): the recurring inquiry that keeps the protocol honest – the questions you ask together about whether it is serving life or reproducing separation. <em>Example: at each review, examine whose objections have been raised and whose have not, what structural conditions make objecting difficult.</em></P>
        <P>The three registers draw on distinct traditions: the technological register from computing's interoperability agreements; the ceremonial from diplomacy and indigenous governance; and the meta-relational from the work of the Gesturing Towards Decolonial Futures (GTDF) collective and the Meta-Relationality Institute (MRI), particularly Vanessa Machado de Oliveira's framing of relational protocols as containers for being-together-across-difference – not aiming for consensus but for relational coherence, and designing explicitly for asymmetry of position, exposure, and risk. The orientation layer is where this inheritance is most direct: its insistence on asking whose interests a protocol serves and whose ways of knowing it privileges is a structural expression of the GTDF/MRI commitment to interrupting the reproduction of colonial and extractive logics within the very structures meant to resist them.</P>
        <P>The inseparability of the three layers is the non-optional design feature that structurally requires the interruption of separation logic.</P>
      </Section>

      <Section title="Design principles for protocols">
        <P>These principles apply whenever protocols are being designed, assessed, or revised.</P>
        <Principle title="Interrupt separation at the level of structure.">A protocol that only specifies rules will produce bureaucracy; one that only cultivates practices will produce good intentions without accountability. Requiring all three layers – interface, practice, and orientation – in every protocol is what makes the interruption of separation structural rather than aspirational. A protocol missing any layer cannot be adopted.</Principle>
        <Principle title="Design for asymmetry.">Aspiration doesn't produce equity; structure does. Build explicit structural mechanisms into the interface layer of every protocol: inverse weighting (smaller organisations' voices count more, not less), caps on accumulation (no agent holds mandates across too many domains), mandatory "who is not in the room" checks before network-wide decisions, collective pre-emptive boundary-setting, and automatic redistribution triggers when accumulation exceeds consent-defined thresholds.</Principle>
        <Principle title="Make voice cheap.">Three-layer governance is inherently costly – meetings, consent rounds, orientation inquiries. Without active design, this cost self-selects for the resourced. So design every protocol with this in mind: make asynchronous participation first-class, provide multiple channels for raising objections, build in objection support, fund participation budgets from solidarity contributions, and commit to response times that make raising concerns feel worthwhile.</Principle>
        <Principle title="Design for scale.">Shared protocols create interoperability: agents who adopt the same protocol can act together even without direct relationship. Design protocols so they work between strangers, not only between friends. This is what enables the network to grow beyond the trust radius of any single relationship – and it is what distinguishes a protocol architecture from a community of practice. At the same time, build in federation and mitosis mechanisms before they are needed, so that growth produces distributed capacity rather than centralised coordination.</Principle>
        <Principle title="Listen and adapt.">Every protocol carries built-in review dates and evolution criteria. Treat the first version of any protocol as a hypothesis, not a settlement. The orientation layer exists precisely to surface what isn't working – but only if the network actually acts on what it learns. Design feedback pathways that are short enough to be responsive and visible enough that adaptation is the norm, not the exception.</Principle>
        <Principle title="Start with simple rules.">The entire design rests on a small set of conceptual tools – relational protocols with three layers, voluntary adoption with consequence, shared commitments as a normative floor. From these, arbitrarily complex network structures can emerge bottom-up, without top-down determination. Resist the urge to pre-specify more than is needed.</Principle>
        <Principle title="Target documented failure modes.">Every structural mechanism – rotation, caps, redistribution triggers, stewardship pairs, participation budgets – should target a specific, empirically observed failure pattern, not a theoretical risk. Design against what has actually gone wrong in comparable networks.</Principle>
      </Section>

      <Section title="Protocol governance and stewardship">
        <GovItem title="Shared commitments.">All protocols must serve a small set of collectively derived commitments, including an explicit reckoning with racialisation, colonialism, and extractive domination as foundational structures Fabric exists within. The precise formulation is to be developed collectively.</GovItem>
        <GovItem title="Creating protocols.">New protocols are proposed in response to identified needs. Before adoption, every protocol passes an asymmetry check (who benefits, who is burdened, whose ways of knowing are privileged), a narrative check (which experiences does this enable, which narrative does it amplify?), a three-layer completeness check, and a consent round among those affected. Built-in review dates and evolution criteria are mandatory.</GovItem>
        <GovItem title="Adopting and evolving protocols.">Protocols are adopted voluntarily but with consequence: adopting a cluster constitutes membership. Protocols evolve through consent, with changes communicated to all adopters and transition periods for adaptation.</GovItem>
        <GovItem title="Distributing stewardship.">Invisible coordination labour concentrated in the most committed is the paradigmatic failure mode for distributed networks. Specify stewardship requirements in every protocol: what tending it needs, by whom, for how long. Rotate stewardship with the review cycle, cap individual loads, hold every function in pairs from different organisations, track stewardship as a contribution, and fund it from the shared resource pool.</GovItem>
        <GovItem title="The wisdom function.">A dedicated function periodically examines the protocol ecosystem: are protocols proliferating unsustainably? Are they drifting from shared commitments? Are orientation layers actually being practised? Where are dark economies forming? This function is itself protected from becoming a power centre through rotation, mandate limits, and accountability to the wider network.</GovItem>
        <GovItem title="Adaptive governance.">Drawing on the observation that many pre-state societies deliberately shifted governance modes by context, the protocol architecture includes a defined crisis mode: trigger conditions defined in advance by consent, time-bounded authority with hard expiry, scope-bounded to the stated crisis, mandatory post-crisis review, and automatic redistribution of any authority, resources, or information that concentrated during the crisis. These are interface-level safeguards, not orientation aspirations.</GovItem>
      </Section>

      <Section title="The generative cycle">
        <P>The architecture's viability rests on a cycle at the level of participant experience:</P>
        <blockquote className="border-l-2 pl-4 my-6 italic opacity-80" style={{ borderColor: "var(--color-border-secondary, #b4b2a9)" }}>
          <em>Commitment</em> (adopting protocols, contributing time and resources) → <em>Interdependence</em> (getting something you can't get alone – mutual aid, coordinated action, shared learning) → <em>Trust</em> (relationships deepen through practice and orientation work) → deeper <em>Commitment</em>.
        </blockquote>
        <GenerativeCycleDiagram />
        <P>The material mechanisms – participation budgets, solidarity contributions, resource flows, distributed stewardship – are design requirements for keeping each transition healthy. They enable the cycle but are not the cycle itself.</P>
        <P>If commitment doesn't produce interdependence – if the network isn't materially useful – people drift away. If interdependence doesn't deepen trust – if relationships stay transactional – the network plateaus at coordination without collective agency. If trust doesn't lead to deeper commitment – if people value the relationships but don't adopt further protocols – the network remains a community of practice rather than a collective agent. Each transition can stall, and each stall has a different design response.</P>
        <P>This is why resource flows are not secondary but foundational: they are the primary mechanism through which commitment becomes interdependence. And it is why the orientation layer matters: it is the primary mechanism through which interdependence becomes trust rather than mere mutual convenience.</P>
      </Section>

      <Section title="How this avoids typical failure modes">
        <P>The architecture is designed around empirically documented failure patterns from comparable networks and movements: invisible labour concentration burning out the most committed while the network believes it distributes power; intermediate coordinating structures accumulating their own interests and becoming obstacles to participation; two-tier membership creating insiders and outsiders; protocol-level decentralisation failing to prevent power re-concentration.</P>
        <P>Each structural mechanism targets a specific, observed failure mode rather than a theoretical risk. The orientation layer of every protocol exists precisely to make emerging problems visible – whose conflicts are processed and whose aren't, where resources are concentrating, whether stewardship is actually distributed or just formally shared. The architecture is itself a learning system: the first cycle is data, not verdict.</P>
      </Section>

      <footer className="mt-16 pt-6 border-t text-sm opacity-50 italic" style={{ borderColor: "var(--color-border-tertiary, #d3d1c7)" }}>
        This overview synthesises the fuller design exploration. It is a working document inviting revision, with open questions preserved in the source material.
      </footer>
    </article>
  );
}
