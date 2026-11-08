import type { EChartsCoreOption } from 'echarts'
import type { LoadPoint, ThresholdRule } from '../types'
import type { ThemeMode } from '../theme/palette'
import { getPalette } from '../theme/palette'
import { formatTime, resolveStatus, statusText, valueText } from '../utils/format'
import { animationOf, axisLabel, emptyGraphic, legendOf, rowHtml, splitLine, titleOf, tooltipBase } from './common'

export interface PowerLoadOptionInput {
  data: LoadPoint[]
  title?: string
  subtitle?: string
  unit?: string
  xAxisName?: string
  yAxisName?: string
  showLegend?: boolean
  animation?: boolean
  theme?: ThemeMode
  background?: string
  threshold?: ThresholdRule
  actualName?: string
  compareName?: string
  forecastName?: string
  showCompare?: boolean
  showForecast?: boolean
}

export const LOAD_DEMO: LoadPoint[] = [
  { time: '2026-11-08 08:00', actual: 1680, compare: 1590, forecast: 1720 },
  { time: '2026-11-08 09:00', actual: 2140, compare: 1980, forecast: 2200 },
  { time: '2026-11-08 10:00', actual: 2680, compare: 2510, forecast: 2740 },
  { time: '2026-11-08 11:00', actual: 2860, compare: 2690, forecast: 2820 },
  { time: '2026-11-08 12:00', actual: 2410, compare: 2280, forecast: 2360 },
  { time: '2026-11-08 13:00', actual: 1860, compare: 1740, forecast: 1900 },
  { time: '2026-11-08 14:00', actual: 2520, compare: 2380, forecast: 2600 },
  { time: '2026-11-08 15:00', actual: 3010, compare: 2840, forecast: 2960 },
  { time: '2026-11-08 16:00', actual: 2920, compare: 2760, forecast: 2880 },
  { time: '2026-11-08 17:00', actual: 2470, compare: 2310, forecast: 2420 },
  { time: '2026-11-08 18:00', actual: 1980, compare: 1860, forecast: 1900 },
]

export const LOAD_THRESHOLD: ThresholdRule = { warning: 2800, danger: 3100, upper: 2800 }

export function buildPowerLoadOption(input: PowerLoadOptionInput): EChartsCoreOption {
  const theme = input.theme ?? 'dark'
  const palette = getPalette(theme)
  const data = input.data ?? []
  const unit = input.unit ?? 'kW'
  const actualName = input.actualName || '实时负荷'
  const compareName = input.compareName || '昨日同期'
  const forecastName = input.forecastName || '预测负荷'
  const hasCompare = input.showCompare ?? data.some((item) => item.compare != null)
  const hasForecast = input.showForecast ?? data.some((item) => item.forecast != null)
  const warning = input.threshold?.warning ?? input.threshold?.upper
  const danger = input.threshold?.danger

  const mark = [
    warning != null
      ? { yAxis: warning, lineStyle: { color: palette.warning, type: 'dashed', width: 1 }, label: { formatter: `预警 ${warning} ${unit}`, color: palette.warning, fontSize: 11 } }
      : null,
    danger != null
      ? { yAxis: danger, lineStyle: { color: palette.danger, type: 'dashed', width: 1 }, label: { formatter: `契约 ${danger} ${unit}`, color: palette.danger, fontSize: 11 } }
      : null,
  ].filter(Boolean)

  const series: Record<string, unknown>[] = [
    {
      name: actualName,
      type: 'line',
      smooth: 0.28,
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 7,
      z: 3,
      lineStyle: { width: 2, color: palette.primary },
      itemStyle: { color: palette.primary },
      areaStyle: {
        color: theme === 'dark' ? 'rgba(0,212,255,0.16)' : 'rgba(8,145,178,0.12)',
      },
      markLine: mark.length ? { symbol: 'none', silent: true, data: mark } : undefined,
      data: data.map((row) => {
        const status = resolveStatus(row.actual, input.threshold)
        const color = status === 'danger' ? palette.danger : status === 'warning' ? palette.warning : palette.primary
        return { value: row.actual, itemStyle: { color }, status }
      }),
    },
  ]

  if (hasCompare) {
    series.push({
      name: compareName,
      type: 'line',
      smooth: 0.28,
      showSymbol: false,
      lineStyle: { width: 1.4, type: 'dashed', color: palette.normal },
      itemStyle: { color: palette.normal },
      data: data.map((row) => row.compare ?? null),
    })
  }

  if (hasForecast) {
    series.push({
      name: forecastName,
      type: 'line',
      smooth: 0.28,
      showSymbol: false,
      lineStyle: { width: 1.4, type: 'dotted', color: palette.warning },
      itemStyle: { color: palette.warning },
      data: data.map((row) => row.forecast ?? null),
    })
  }

  return {
    backgroundColor: input.background || palette.bg,
    ...animationOf(input.animation !== false),
    title: titleOf(palette, input.title, input.subtitle),
    legend: legendOf(palette, input.showLegend !== false),
    tooltip: {
      ...tooltipBase(palette),
      formatter(params: unknown) {
        const list = (Array.isArray(params) ? params : [params]) as Array<{
          axisValue: string | number
          seriesName: string
          value: number | { value: number }
          color: string
          data?: { status?: string }
        }>
        if (!list.length) return ''
        const lines = [`<b>${formatTime(list[0].axisValue)}</b>`]
        list.forEach((item) => {
          const value = typeof item.value === 'number' ? item.value : item.value?.value
          if (value == null || Number.isNaN(Number(value))) return
          const status = item.seriesName === actualName ? resolveStatus(Number(value), input.threshold) : undefined
          lines.push(rowHtml(item.seriesName, valueText(Number(value), unit, 0), status, item.color))
        })
        const actual = list.find((item) => item.seriesName === actualName)
        const actualValue = typeof actual?.value === 'number' ? actual.value : actual?.value?.value
        if (actualValue != null) {
          const status = resolveStatus(Number(actualValue), input.threshold)
          lines.push(rowHtml('状态', statusText(status), status, palette.primary))
        }
        return lines.join('<br/>')
      },
    },
    grid: { left: 58, right: 24, top: 78, bottom: 58 },
    xAxis: {
      type: 'category',
      name: input.xAxisName || '',
      data: data.map((row) => row.time),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { ...axisLabel(palette), formatter: (value: string) => formatTime(value).slice(11, 16) },
      nameTextStyle: { color: palette.axis },
    },
    yAxis: {
      type: 'value',
      name: input.yAxisName || unit,
      nameTextStyle: { color: palette.axis, fontSize: 11 },
      axisLabel: axisLabel(palette),
      splitLine: splitLine(palette),
      axisLine: { show: false },
    },
    dataZoom: data.length
      ? [
          { type: 'inside', throttle: 50 },
          {
            type: 'slider',
            height: 16,
            bottom: 12,
            borderColor: 'transparent',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(15,40,70,0.04)',
            fillerColor: 'rgba(0,212,255,0.18)',
            handleSize: 12,
            textStyle: { color: palette.text, fontSize: 10 },
          },
        ]
      : [],
    graphic: emptyGraphic(palette, data.length === 0),
    series,
  }
}
