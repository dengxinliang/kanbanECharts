import type { EChartsCoreOption } from 'echarts'
import type { EnergyPoint, ThresholdRule } from '../types'
import type { Palette, ThemeMode } from '../theme/palette'
import { getPalette, getSeriesColors } from '../theme/palette'
import { formatTime, resolveStatus, statusText, valueText as valueWithUnit } from '../utils/format'
import { animationOf, axisLabel, emptyGraphic, legendOf, rowHtml, splitLine, titleOf, tooltipBase } from './common'

export interface EnergyAreaOptionInput {
  data: EnergyPoint[]
  compareData?: EnergyPoint[]
  compareLabel?: string
  title?: string
  subtitle?: string
  unit?: string
  xAxisName?: string
  yAxisName?: string
  showLegend?: boolean
  animation?: boolean
  theme?: ThemeMode
  background?: string
  colors?: string[]
  threshold?: ThresholdRule
  seriesThreshold?: Record<string, ThresholdRule>
  showTotal?: boolean
}

export const ENERGY_DEMO: EnergyPoint[] = [
  { time: '2026-11-08 08:00', values: { 冲压车间: 428, 焊接车间: 372, 涂装车间: 618, 总装车间: 256, 动力站: 184 } },
  { time: '2026-11-08 09:00', values: { 冲压车间: 462, 焊接车间: 398, 涂装车间: 646, 总装车间: 278, 动力站: 191 } },
  { time: '2026-11-08 10:00', values: { 冲压车间: 508, 焊接车间: 434, 涂装车间: 702, 总装车间: 304, 动力站: 206 } },
  { time: '2026-11-08 11:00', values: { 冲压车间: 486, 焊接车间: 451, 涂装车间: 728, 总装车间: 312, 动力站: 214 } },
  { time: '2026-11-08 12:00', values: { 冲压车间: 392, 焊接车间: 406, 涂装车间: 674, 总装车间: 268, 动力站: 198 } },
  { time: '2026-11-08 13:00', values: { 冲压车间: 358, 焊接车间: 296, 涂装车间: 528, 总装车间: 214, 动力站: 176 } },
  { time: '2026-11-08 14:00', values: { 冲压车间: 474, 焊接车间: 422, 涂装车间: 696, 总装车间: 292, 动力站: 208 } },
  { time: '2026-11-08 15:00', values: { 冲压车间: 522, 焊接车间: 468, 涂装车间: 746, 总装车间: 326, 动力站: 226 } },
  { time: '2026-11-08 16:00', values: { 冲压车间: 498, 焊接车间: 441, 涂装车间: 712, 总装车间: 308, 动力站: 218 } },
  { time: '2026-11-08 17:00', values: { 冲压车间: 446, 焊接车间: 402, 涂装车间: 662, 总装车间: 284, 动力站: 202 } },
  { time: '2026-11-08 18:00', values: { 冲压车间: 412, 焊接车间: 368, 涂装车间: 604, 总装车间: 248, 动力站: 188 } },
]

/** 昨日同期，整体略低，涂装烘房午后仍是大户 */
export const ENERGY_COMPARE_DEMO: EnergyPoint[] = ENERGY_DEMO.map((row) => ({
  time: row.time,
  values: Object.fromEntries(Object.entries(row.values).map(([key, value]) => [key, Math.round(value * 0.93)])),
}))

export const ENERGY_THRESHOLD: ThresholdRule = { warning: 1800, danger: 2100 }

function namesOf(data: EnergyPoint[]): string[] {
  const set = new Set<string>()
  data.forEach((row) => Object.keys(row.values).forEach((name) => set.add(name)))
  return [...set]
}

function totalOf(row: EnergyPoint): number {
  return Object.values(row.values).reduce((sum, value) => sum + value, 0)
}

export function buildEnergyAreaOption(input: EnergyAreaOptionInput): EChartsCoreOption {
  const theme = input.theme ?? 'dark'
  const palette: Palette = getPalette(theme)
  const colors = getSeriesColors(theme, input.colors)
  const data = input.data ?? []
  const names = namesOf(data)
  const unit = input.unit ?? 'kWh'
  const showTotal = input.showTotal !== false
  const animated = input.animation !== false
  const compareLabel = input.compareLabel ?? '对比'

  const series: Record<string, unknown>[] = names.map((name, index) => ({
    name,
    type: 'line',
    stack: 'energy',
    smooth: 0.25,
    showSymbol: false,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { width: 1.5 },
    areaStyle: { opacity: theme === 'dark' ? 0.28 : 0.2 },
    emphasis: { focus: 'series' },
    color: colors[index % colors.length],
    data: data.map((row) => row.values[name] ?? 0),
  }))

  if (input.compareData?.length) {
    names.forEach((name, index) => {
      series.push({
        name: `${name} ${compareLabel}`,
        type: 'line',
        smooth: 0.25,
        showSymbol: false,
        symbol: 'none',
        lineStyle: { width: 1.2, type: 'dashed', color: colors[index % colors.length] },
        itemStyle: { color: colors[index % colors.length] },
        data: data.map((row) => {
          const hit = input.compareData?.find((item) => item.time === row.time)
          return hit?.values[name] ?? null
        }),
      })
    })
  }

  if (showTotal && data.length) {
    const warning = input.threshold?.warning ?? input.threshold?.upper
    const danger = input.threshold?.danger
    const markData = [
      warning != null
        ? { yAxis: warning, lineStyle: { color: palette.warning, type: 'dashed' }, label: { formatter: `预警 ${warning}`, color: palette.warning } }
        : null,
      danger != null
        ? { yAxis: danger, lineStyle: { color: palette.danger, type: 'dashed' }, label: { formatter: `超限 ${danger}`, color: palette.danger } }
        : null,
    ].filter(Boolean)

    series.push({
      name: '合计',
      type: 'line',
      smooth: 0.2,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 6,
      z: 5,
      lineStyle: { width: 1.6, color: palette.title },
      data: data.map((row) => {
        const value = totalOf(row)
        const status = resolveStatus(value, input.threshold)
        const color = status === 'danger' ? palette.danger : status === 'warning' ? palette.warning : palette.primary
        return { value, itemStyle: { color }, status }
      }),
      markLine: markData.length
        ? { symbol: 'none', silent: true, data: markData, label: { fontSize: 11 } }
        : undefined,
    })
  }

  return {
    backgroundColor: input.background || palette.bg,
    color: colors,
    ...animationOf(animated),
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
        const time = formatTime(list[0].axisValue)
        const lines = [`<b>${time}</b>`]
        list.forEach((item) => {
          const value = typeof item.value === 'number' ? item.value : item.value?.value
          if (value == null || Number.isNaN(value)) return
          const workshop = item.seriesName.replace(` ${compareLabel}`, '')
          const rule = item.seriesName === '合计' ? input.threshold : input.seriesThreshold?.[workshop]
          const status = item.data?.status || (item.seriesName.includes(compareLabel) ? undefined : resolveStatus(value, rule))
          lines.push(rowHtml(item.seriesName, valueWithUnit(value, unit, 0), status, item.color))
        })
        const total = list.find((item) => item.seriesName === '合计')
        const totalValue = typeof total?.value === 'number' ? total.value : total?.value?.value
        if (totalValue != null) {
          lines.push(rowHtml('状态', statusText(resolveStatus(totalValue, input.threshold)), resolveStatus(totalValue, input.threshold), palette.primary))
        }
        return lines.join('<br/>')
      },
    },
    grid: { left: 56, right: 24, top: 78, bottom: 58 },
    xAxis: {
      type: 'category',
      name: input.xAxisName || '',
      nameTextStyle: { color: palette.axis, fontSize: 11 },
      data: data.map((row) => row.time),
      axisLine: { lineStyle: { color: palette.grid } },
      axisTick: { show: false },
      axisLabel: { ...axisLabel(palette), formatter: (value: string) => formatTime(value).slice(11, 16) },
    },
    yAxis: {
      type: 'value',
      name: input.yAxisName || unit,
      nameTextStyle: { color: palette.axis, fontSize: 11, padding: [0, 0, 0, 8] },
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
            dataBackground: { lineStyle: { color: palette.primary, opacity: 0.3 }, areaStyle: { opacity: 0 } },
          },
        ]
      : [],
    graphic: emptyGraphic(palette, data.length === 0),
    series,
  }
}
