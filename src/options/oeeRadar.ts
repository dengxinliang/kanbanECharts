import type { EChartsCoreOption } from 'echarts'
import type { OeeIndicator, OeeSeries } from '../types'
import type { ThemeMode } from '../theme/palette'
import { getPalette, getSeriesColors } from '../theme/palette'
import { formatNumber, statusText } from '../utils/format'
import type { ThresholdRule } from '../types'
import { animationOf, emptyGraphic, legendOf, titleOf, itemTooltip } from './common'

export interface OeeRadarOptionInput {
  indicators: OeeIndicator[]
  series: OeeSeries[]
  target?: number[]
  targetName?: string
  title?: string
  subtitle?: string
  unit?: string
  showLegend?: boolean
  animation?: boolean
  theme?: ThemeMode
  background?: string
  colors?: string[]
  threshold?: ThresholdRule
}

export const OEE_INDICATORS: OeeIndicator[] = [
  { name: '时间稼动率', max: 100 },
  { name: '性能稼动率', max: 100 },
  { name: '良品率', max: 100 },
  { name: '计划达成率', max: 100 },
  { name: '设备完好率', max: 100 },
  { name: '一次交检合格率', max: 100 },
]

export const OEE_DEMO: OeeSeries[] = [
  { name: '冲压 A 线', values: [86.4, 91.2, 98.2, 94.0, 97.1, 97.5] },
  { name: '焊接 B 线', values: [78.6, 84.1, 96.4, 88.2, 93.0, 95.1] },
  { name: '涂装 C 线', values: [82.2, 76.4, 94.8, 81.5, 90.4, 93.6] },
]

export const OEE_TARGET = [90, 92, 98, 95, 98, 98]

export const OEE_HISTORY = [
  { time: '2026-11-08 08:00', series: OEE_DEMO },
  {
    time: '2026-11-08 13:00',
    series: [
      { name: '冲压 A 线', values: [84.1, 89.4, 97.6, 91.2, 96.4, 97.1] },
      { name: '焊接 B 线', values: [80.2, 85.0, 96.8, 89.4, 93.6, 95.4] },
      { name: '涂装 C 线', values: [79.5, 74.8, 93.9, 78.6, 89.2, 92.8] },
    ],
  },
  {
    time: '2026-11-08 16:00',
    series: [
      { name: '冲压 A 线', values: [87.2, 90.6, 98.4, 95.1, 97.4, 97.8] },
      { name: '焊接 B 线', values: [76.4, 82.2, 95.8, 86.1, 92.2, 94.6] },
      { name: '涂装 C 线', values: [83.0, 77.1, 95.2, 82.4, 90.8, 94.0] },
    ],
  },
]

export function buildOeeRadarOption(input: OeeRadarOptionInput): EChartsCoreOption {
  const theme = input.theme ?? 'dark'
  const palette = getPalette(theme)
  const colors = getSeriesColors(theme, input.colors)
  const indicators = input.indicators.length ? input.indicators : OEE_INDICATORS
  const series = input.series ?? []
  const unit = input.unit ?? '%'
  const warningLine = input.threshold?.warning ?? input.threshold?.upper ?? 85

  const radarSeries = series.map((item, index) => ({
    value: item.values,
    name: item.name,
    itemStyle: { color: colors[index % colors.length] },
    lineStyle: { width: 1.8, color: colors[index % colors.length] },
    areaStyle: { color: colors[index % colors.length], opacity: theme === 'dark' ? 0.16 : 0.1 },
  }))

  if (input.target?.length) {
    radarSeries.push({
      value: input.target,
      name: input.targetName || '目标',
      itemStyle: { color: palette.warning },
      lineStyle: { width: 1.2, color: palette.warning, type: 'dashed' } as { width: number; color: string },
      areaStyle: { color: palette.warning, opacity: 0 },
    })
  }

  return {
    backgroundColor: input.background || palette.bg,
    color: colors,
    ...animationOf(input.animation !== false),
    title: titleOf(palette, input.title, input.subtitle),
    legend: { ...legendOf(palette, input.showLegend !== false), top: 36 },
    tooltip: {
      ...itemTooltip(palette),
      formatter(params: unknown) {
        const item = params as { name?: string; value?: number[]; color?: string }
        if (!item.value) return ''
        const lines = [`<b>${item.name}</b>`]
        item.value.forEach((value, index) => {
          const indicator = indicators[index]
          const level = value < (input.threshold?.danger ?? 75) ? 'danger' : value < warningLine ? 'warning' : 'normal'
          const color = level === 'danger' ? palette.danger : level === 'warning' ? palette.warning : palette.normal
          lines.push(
            `<span style="opacity:.75">${indicator?.name ?? index}</span>　${formatNumber(value, 1)} ${unit} · <span style="color:${color}">${statusText(level)}</span>`,
          )
        })
        return lines.join('<br/>')
      },
    },
    radar: {
      center: ['50%', '58%'],
      radius: '62%',
      splitNumber: 4,
      axisName: { color: palette.legend, fontSize: 12 },
      splitLine: { lineStyle: { color: palette.grid } },
      splitArea: { areaStyle: { color: [palette.splitArea, 'transparent'] } },
      axisLine: { lineStyle: { color: palette.grid } },
      indicator: indicators.map((item) => ({ name: item.name, max: item.max ?? 100 })),
    },
    graphic: emptyGraphic(palette, series.length === 0),
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: radarSeries,
      },
    ],
  }
}
