function CycleLabelBg({ x, y, w, h }) {
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="3" fill="var(--color-background-primary, #fff)" />;
}

export default function GenerativeCycleDiagram() {
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
      <text x="340" y="352" textAnchor="middle" fontSize={11} fill="#D85A30">compass layers</text>
      <text x="340" y="370" textAnchor="middle" fontSize={10} fill="#D85A30" opacity={0.7}>Stalls: stays transactional</text>

      <CycleLabelBg x={192} y={138} w={140} h={50} />
      <text x="192" y="128" textAnchor="middle" fontSize={11} fill="#0F6E56">Enabled by protocol</text>
      <text x="192" y="142" textAnchor="middle" fontSize={11} fill="#0F6E56">interoperability</text>
      <text x="192" y="160" textAnchor="middle" fontSize={10} fill="#0F6E56" opacity={0.7}>Stalls: plateaus as CoP</text>

      <text x="340" y="400" textAnchor="middle" fontSize={12} fill="var(--color-text-secondary, #5f5e5a)">Each transition can stall. Each stall has a different design response.</text>
    </svg>
  );
}
