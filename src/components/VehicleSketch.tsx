import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { CaravanSubtype, VehicleType } from '../types';

type Shape = CaravanSubtype | 'campervan' | 'other';
type Win = [number, number, number, number]; // x, y, ancho, alto

// Perfiles laterales simplificados (el vehículo mira hacia la derecha). viewBox 250 x 110.
const SHAPES: Record<Shape, { body: string[]; glass: string; windows: Win[] }> = {
  capuchina: {
    body: ['M18 86V30Q18 22 26 22H196Q206 22 208 32L210 50L226 54Q236 58 238 70V86Z'],
    glass: 'M212 58L224 60Q231 62 232 70H212Z',
    windows: [[56, 38, 56, 20], [124, 38, 50, 20]],
  },
  integral: {
    body: ['M18 86V28Q18 20 26 20H176Q190 20 198 32L234 66Q240 72 240 80V86Z'],
    glass: 'M186 30Q190 30 194 36L222 64H186Z',
    windows: [[48, 34, 54, 22], [112, 34, 46, 22]],
  },
  perfilada: {
    body: ['M18 86V32Q18 24 26 24H150Q170 24 184 34L226 56Q238 62 240 74V86Z'],
    glass: 'M176 38Q184 40 190 44L218 58H176Z',
    windows: [[48, 38, 52, 20], [110, 38, 44, 20]],
  },
  campervan: {
    body: ['M18 86V46Q18 38 26 38H150Q170 38 182 48L222 62Q238 66 240 76V86Z'],
    glass: 'M168 46Q174 46 180 52L212 62H168Z',
    windows: [[56, 48, 44, 14]],
  },
  other: {
    body: ['M18 86V28Q18 22 24 22H160V86Z', 'M160 48H206Q214 48 220 56L236 70Q240 74 240 80V86H160Z'],
    glass: 'M170 54H204Q210 54 214 60L224 70H170Z',
    windows: [],
  },
};

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  return `#${((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

export default function VehicleSketch({ type, subtype, color, width = 220 }: { type: VehicleType; subtype?: CaravanSubtype; color: string; width?: number }) {
  const shape: Shape = type === 'caravan' ? (subtype ?? 'capuchina') : type;
  const { body, glass, windows } = SHAPES[shape];
  const edge = shade(color, -0.28);
  const glassColor = '#CFE3EE';
  return (
    <Svg width={width} height={(width * 110) / 250} viewBox="0 0 250 110">
      <Rect x={6} y={100} width={238} height={2} rx={1} fill="#C5CDC9" />
      {body.map((d, i) => (
        <Path key={i} d={d} fill={color} stroke={edge} strokeWidth={2} strokeLinejoin="round" />
      ))}
      {windows.map(([x, y, w, h], i) => (
        <Rect key={i} x={x} y={y} width={w} height={h} rx={3} fill={glassColor} stroke={edge} strokeWidth={1.5} />
      ))}
      <Path d={glass} fill={glassColor} stroke={edge} strokeWidth={1.5} strokeLinejoin="round" />
      {[62, 192].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={88} r={13} fill="#1D262C" />
          <Circle cx={cx} cy={88} r={5} fill="#B8C1C6" />
        </G>
      ))}
    </Svg>
  );
}
