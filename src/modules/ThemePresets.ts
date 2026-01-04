
export type UiSettings = {
  background: string
  speed: number
  density: number
  intensity: number
  hue: number
  brightness: number
  glassAlpha: number
  glassTopbarAlpha?: number
  glow: number
  accent: string
  colTodo: string; colDoing: string; colDone: string;
}

export const ThemePresets: Record<string, Partial<UiSettings>> = {
  olympus: {
    background: 'neonGrid', hue: 190, speed: 1.1, density: 1,
    brightness: 0.85, intensity: 1.1, accent: '#00E7FF',
    glassAlpha: 0.34, glassTopbarAlpha: 0.24,
    colTodo: '#00E7FF', colDoing: '#FF6AFB', colDone: '#FFB14D',
  },
  magentaVoid: {
    background: 'neonTunnel', hue: 300, speed: 1.2, brightness: 0.9,
    accent: '#FF5CE1', glassAlpha: 0.32, glassTopbarAlpha: 0.22,
    colTodo: '#FF5CE1', colDoing: '#8A7CFF', colDone: '#52FFE6',
  },
  emeraldFocus: {
    background: 'hexPulse', hue: 160, speed: 1, density: 1.2,
    accent: '#5CFFB0', glassAlpha: 0.30, glassTopbarAlpha: 0.20,
    colTodo: '#5CFFB0', colDoing: '#00E7FF', colDone: '#FFE36D',
  },
  cyanCircuit: {
    background: 'holoCircuit', hue: 190, speed: 1.5, brightness: 0.9,
    accent: '#00FFFF', glassAlpha: 0.35, glassTopbarAlpha: 0.25,
    colTodo: '#00FFFF', colDoing: '#63A9FF', colDone: '#FFB14D',
  },
  halloweenNight: {
    background: 'halloween', hue: 25, speed: 1, brightness: 0.85,
    accent: '#FFA12B', glassAlpha: 0.28, glassTopbarAlpha: 0.18,
    colTodo: '#FFA12B', colDoing: '#FF5C5C', colDone: '#7DFF7D',
  },
}
