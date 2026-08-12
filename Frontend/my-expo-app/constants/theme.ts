import { Dimensions } from 'react-native';

export const colors = {
  bg: '#0a0f1e',
  bg2: '#111a33',
  card: '#141d38',
  card2: '#182242',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#f2f4ff',
  muted: '#98a3c3',
  muted2: '#6b7696',
  primary: '#8b7cf7',
  primaryDark: '#6a5ae0',
  primaryLight: 'rgba(139,124,247,0.15)',
  accent: '#00e5a8',
  accentDark: '#00c993',
  accentLight: 'rgba(0,229,168,0.12)',
  danger: '#ff6b6b',
  dangerLight: 'rgba(255,107,107,0.12)',
  warning: '#ffb347',
  warningLight: 'rgba(255,179,71,0.12)',
  input: '#0d1428',
  green: '#22c55e',
  blue: '#38bdf8',
  gold: '#ffd166',
  white: '#ffffff',
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 } as const,
  h2: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 } as const,
  subtitle: { fontSize: 13, fontWeight: '500' } as const,
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 } as const,
  body: { fontSize: 15 } as const,
  caption: { fontSize: 12.5, color: '#98a3c3' } as const,
};

const _dim = Dimensions.get('window');
export const screenW = _dim.width;
export const screenH = _dim.height;

// Escala proporcional al ancho de pantalla (baseline 390px ≈ iPhone estándar).
// En tablets el factor queda limitado para no inflar tamaños.
export const rs = (size: number): number => Math.round(size * (Math.min(screenW, 520) / 390));
