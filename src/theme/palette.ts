export type ThemeMode = 'dark' | 'light'

export interface Palette {
  bg: string
  primary: string
  normal: string
  warning: string
  danger: string
  text: string
  title: string
  sub: string
  grid: string
  axis: string
  tooltipBg: string
  tooltipBorder: string
  splitArea: string
  legend: string
  idle: string
}

export const DARK: Palette = {
  bg: '#081424',
  primary: '#00d4ff',
  normal: '#36d399',
  warning: '#fbbd23',
  danger: '#f87272',
  text: '#8ea0b5',
  title: '#e7f2fb',
  sub: '#7f93a8',
  grid: 'rgba(143, 176, 206, 0.12)',
  axis: '#6f8499',
  tooltipBg: 'rgba(6, 16, 32, 0.94)',
  tooltipBorder: 'rgba(0, 212, 255, 0.35)',
  splitArea: 'rgba(0, 212, 255, 0.045)',
  legend: '#c5d4e4',
  idle: '#7f93a8',
}

export const LIGHT: Palette = {
  bg: '#f3f6fb',
  primary: '#0891b2',
  normal: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  text: '#526277',
  title: '#102033',
  sub: '#64748b',
  grid: 'rgba(15, 40, 70, 0.08)',
  axis: '#64748b',
  tooltipBg: 'rgba(255, 255, 255, 0.97)',
  tooltipBorder: 'rgba(8, 145, 178, 0.35)',
  splitArea: 'rgba(8, 145, 178, 0.05)',
  legend: '#334155',
  idle: '#94a3b8',
}

const SERIES_DARK = ['#00d4ff', '#36d399', '#7aa2ff', '#fbbd23', '#c084fc', '#5eead4']
const SERIES_LIGHT = ['#0891b2', '#059669', '#4f46e5', '#d97706', '#7c3aed', '#0f766e']

export function getPalette(theme: ThemeMode = 'dark'): Palette {
  return theme === 'light' ? LIGHT : DARK
}

export function getSeriesColors(theme: ThemeMode = 'dark', colors?: string[]): string[] {
  if (colors && colors.length) return colors
  return theme === 'light' ? SERIES_LIGHT : SERIES_DARK
}
