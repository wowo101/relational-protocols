export default function ThreeLayersDiagram() {
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
