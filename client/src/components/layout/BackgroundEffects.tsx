/**
 * Camada de fundo decorativa: 6 spots radiais laranja desfocados +
 * vinheta sutil nas bordas. Posicionada `fixed inset-0` com `z-0` e
 * `pointer-events-none` — fica atrás de tudo e não captura cliques.
 * A animação `pulse-glow` (definida em index.css) faz os spots
 * respirarem suavemente (8s, escala 1 → 1.05 → 1).
 */
type Spot = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width: string;
  height: string;
  color: string;
  blur: string;
  /** Atraso da animação para os spots não pulsarem em sincronia. */
  delay?: string;
};

const SPOTS: Spot[] = [
  // 1) Superior esquerdo
  {
    top: '-200px',
    left: '-200px',
    width: '700px',
    height: '700px',
    color: 'rgba(249, 115, 22, 0.28)',
    blur: '90px',
    delay: '0s',
  },
  // 2) Superior direito
  {
    top: '-150px',
    right: '-150px',
    width: '500px',
    height: '500px',
    color: 'rgba(249, 115, 22, 0.22)',
    blur: '80px',
    delay: '1.5s',
  },
  // 3) Meio direito (laranja escuro)
  {
    top: '40%',
    right: '-250px',
    width: '600px',
    height: '600px',
    color: 'rgba(154, 52, 18, 0.30)',
    blur: '100px',
    delay: '3s',
  },
  // 4) Inferior esquerdo
  {
    bottom: '-200px',
    left: '-150px',
    width: '600px',
    height: '600px',
    color: 'rgba(249, 115, 22, 0.20)',
    blur: '90px',
    delay: '4.5s',
  },
  // 5) Inferior direito (laranja claro)
  {
    bottom: '-150px',
    right: '-100px',
    width: '500px',
    height: '500px',
    color: 'rgba(254, 215, 170, 0.15)',
    blur: '80px',
    delay: '2s',
  },
  // 6) Centro (laranja escuro grande)
  {
    top: '20%',
    left: '20%',
    width: '800px',
    height: '800px',
    color: 'rgba(154, 52, 18, 0.12)',
    blur: '110px',
    delay: '6s',
  },
];

export default function BackgroundEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {SPOTS.map((s, idx) => (
        <div
          key={idx}
          className="animate-pulse-glow absolute"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            bottom: s.bottom,
            width: s.width,
            height: s.height,
            background: `radial-gradient(circle, ${s.color} 0%, transparent 70%)`,
            filter: `blur(${s.blur})`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* Vinheta sutil pra escurecer as bordas e dar profundidade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  );
}
