import type { Palette } from '../theme/palette'
import { formatNumber, statusText } from '../utils/format'

export function tooltipBase(palette: Palette) {
  return {
    trigger: 'axis' as const,
    confine: true,
    backgroundColor: palette.tooltipBg,
    borderColor: palette.tooltipBorder,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: palette.title, fontSize: 12 },
    extraCssText: 'border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.28);',
    axisPointer: {
      type: 'line' as const,
      lineStyle: { color: palette.primary, width: 1, type: 'dashed' as const },
    },
  }
}

export function itemTooltip(palette: Palette) {
  return { ...tooltipBase(palette), trigger: 'item' as const }
}

export function animationOf(enabled: boolean) {
  return {
    animation: enabled,
    animationDuration: enabled ? 480 : 0,
    animationDurationUpdate: enabled ? 280 : 0,
    animationEasing: 'cubicOut' as const,
  }
}

export function axisLabel(palette: Palette) {
  return { color: palette.text, fontSize: 11 }
}

export function splitLine(palette: Palette) {
  return { lineStyle: { color: palette.grid, type: 'dashed' as const } }
}

export function legendOf(palette: Palette, show: boolean) {
  return {
    show,
    top: 8,
    right: 12,
    itemWidth: 12,
    itemHeight: 8,
    textStyle: { color: palette.legend, fontSize: 12 },
    icon: 'roundRect' as const,
  }
}

export function titleOf(palette: Palette, text?: string, subtext?: string) {
  return {
    text: text ?? '',
    subtext: subtext ?? '',
    left: 12,
    top: 6,
    itemGap: 4,
    textStyle: { color: palette.title, fontSize: 15, fontWeight: 600, fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif' },
    subtextStyle: { color: palette.sub, fontSize: 12 },
  }
}

export function rowHtml(label: string, value: string, status?: string, color?: string): string {
  const state = status ? ` · <span style="color:${color ?? 'inherit'}">${statusText(status)}</span>` : ''
  return `<span style="opacity:.75">${label}</span>　${value}${state}`
}

export function valueText(value: number, unit?: string, digits = 1): string {
  const text = formatNumber(value, digits)
  return unit ? `${text} ${unit}` : text
}

export function emptyGraphic(palette: Palette, show: boolean) {
  if (!show) return []
  return [
    {
      type: 'text',
      left: 'center',
      top: 'middle',
      style: { text: '所选时段无数据', fill: palette.sub, fontSize: 13 },
    },
  ]
}
