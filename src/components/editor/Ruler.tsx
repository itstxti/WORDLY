/**
 * Regla horizontal estilo Word / Google Docs.
 * Mide 210 mm (A4) y marca los márgenes de 25,4 mm. Es puramente visual.
 */
const MARGIN = 25.4;
const PAGE = 210;
const H = 8;

export const Ruler = () => {
  const items: JSX.Element[] = [];
  // k = medios centímetros contados desde el margen izquierdo
  for (let k = -5; k <= 36; k++) {
    const x = MARGIN + k * 5;
    if (x < 1 || x > PAGE - 1) continue;
    if (k % 2 === 0) {
      if (k !== 0) {
        items.push(
          <text key={`t${k}`} x={x} y={5.5} fontSize={2.7} textAnchor="middle" fill="#5f6368" fontFamily="Segoe UI, system-ui, sans-serif">
            {Math.abs(k / 2)}
          </text>
        );
      }
    } else {
      items.push(<line key={`l${k}`} x1={x} x2={x} y1={3} y2={5} stroke="#80868b" strokeWidth={0.28} />);
    }
  }

  return (
    <svg
      width="210mm"
      height="8mm"
      viewBox={`0 0 ${PAGE} ${H}`}
      className="block rounded-[3px]"
      role="img"
      aria-label="Regla"
    >
      <rect x={0} y={0} width={PAGE} height={H} fill="#d9dee7" />
      <rect x={MARGIN} y={0} width={PAGE - 2 * MARGIN} height={H} fill="#ffffff" />
      <line x1={0} x2={PAGE} y1={H - 0.15} y2={H - 0.15} stroke="#c4c9d2" strokeWidth={0.3} />
      {items}
      {/* marcadores de sangría */}
      <polygon points={`${MARGIN - 1.1},0.6 ${MARGIN + 1.1},0.6 ${MARGIN},2.3`} fill="#8a9099" />
      <polygon points={`${MARGIN - 1.1},7.4 ${MARGIN + 1.1},7.4 ${MARGIN},5.7`} fill="#8a9099" />
      <polygon points={`${PAGE - MARGIN - 1.1},7.4 ${PAGE - MARGIN + 1.1},7.4 ${PAGE - MARGIN},5.7`} fill="#8a9099" />
    </svg>
  );
};
