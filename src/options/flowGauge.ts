import type { EChartsCoreOption } from 'echarts'
import type { FlowChannel, ThresholdRule } from '../types'
import type { ThemeMode } from '../theme/palette'
import { getPalette } from '../theme/palette'
import { formatNumber, resolveStatus, statusText } from '../utils/format'
import { animationOf, emptyGraphic, titleOf, itemTooltip } from './common'

export interface FlowGaugeOptionInput {
  channels: FlowChannel[]
  title?: string
  subtitle?: string
  unit?: string
  showLegend?: boolean
  animation?: boolean
  theme?: ThemeMode
  background?: string
  compareName?: string
}

export const FLOW_DEMO: FlowChannel[] = [
  { name: '循环冷却水', value: 96.4, compare: 88.2, min: 0, max: 140, unit: 'm³/h', threshold: { warning: 110, danger: 125 } },
  { name: '压缩空气母管', value: 46.8, compare: 44.1, min: 0, max: 60, unit: 'Nm³/min', threshold: { warning: 50, danger: 55 } },
  { name: '工艺冷冻水', value: 33.6, compare: 31.4, min: 0, max: 50, unit: 'm³/h', threshold: { lower: 12, warning: 40, danger: 46 } },
]

export const FLOW_HISTORY = [
  { time: '2026-11-08 08:00', channels: FLOW_DEMO.map((item) => ({ ...item, value: Math.round(item.value * 0.86 * 10) / 10 })) },
  { time: '2026-11-08 13:00', channels: FLOW_DEMO.map((item) => ({ ...item, value: Math.round(item.value * 0.74 * 10) / 10 })) },
  { time: '2026-11-08 16:00', channels: FLOW_DEMO },
]

function zoneColor(max: number, rule: ThresholdRule | undefined, normal: string, warning: string, danger: string): [number, string][] {
  const warn = Math.min(max, rule?.warning ?? rule?.upper ?? max * 0.8)
  const high = Math.min(max, rule?.danger ?? max * 0.92)
  const w = Math.max(0.02, Math.min(0.98, warn / max))
  const d = Math.max(w + 0.01, Math.min(1, high / max))
  return [
    [w, normal],
    [d, warning],
    [1, danger],
  ]
}

export function buildFlowGaugeOption(input: FlowGaugeOptionInput): EChartsCoreOption {
  const theme = input.theme ?? 'dark'
  const palette = getPalette(theme)
  const channels = input.channels ?? []
  const glow = theme === 'dark' ? 14 : 0
  const compact = channels.length > 2
  const series: Record<string, unknown>[] = []

  channels.forEach((channel, index) => {
    const min = channel.min ?? 0
    const max = channel.max ?? Math.max(channel.value * 1.4, 100)
    const span = Math.max(max - min, 1)
    const status = resolveStatus(channel.value, channel.threshold)
    const color = status === 'danger' ? palette.danger : status === 'warning' ? palette.warning : palette.primary
    const centerX = ((index + 0.5) / Math.max(channels.length, 1)) * 100
    const center: [string, string] = [`${centerX}%`, compact ? '58%' : '56%']
    const radius = compact ? '46%' : '68%'
    const zones = zoneColor(span, shiftRule(channel.threshold, min), palette.normal, palette.warning, palette.danger)

    series.push({
      id: `flow-${index}`,
      name: channel.name,
      type: 'gauge',
      min,
      max,
      center,
      radius,
      startAngle: 210,
      endAngle: -30,
      z: 2,
      pointer: {
        length: '60%',
        width: compact ? 4 : 5,
        itemStyle: { color, shadowBlur: glow, shadowColor: color },
      },
      anchor: {
        show: true,
        size: compact ? 8 : 12,
        itemStyle: { color, shadowBlur: glow, shadowColor: color },
      },
      progress: { show: false },
      axisLine: { lineStyle: { width: compact ? 10 : 14, color: zones } },
      axisTick: { show: false },
      splitLine: { length: 8, distance: 2, lineStyle: { color: palette.axis, width: 1 } },
      axisLabel: { color: palette.text, distance: 14, fontSize: compact ? 9 : 11 },
      title: {
        show: input.showLegend !== false,
        offsetCenter: [0, compact ? '78%' : '72%'],
        color: palette.legend,
        fontSize: compact ? 12 : 13,
      },
      detail: {
        valueAnimation: input.animation !== false,
        offsetCenter: [0, '42%'],
        fontSize: compact ? 18 : 26,
        fontWeight: 600,
        color,
        formatter: (value: number) => `${formatNumber(value, 1)}`,
      },
      data: [{ value: channel.value, name: channel.name }],
    })

    if (channel.compare != null) {
      series.push({
        id: `flow-compare-${index}`,
        name: `${channel.name} ${input.compareName || '对比'}`,
        type: 'gauge',
        min,
        max,
        center,
        radius,
        startAngle: 210,
        endAngle: -30,
        z: 3,
        pointer: { length: '48%', width: 3, itemStyle: { color: palette.idle } },
        anchor: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        title: { show: false },
        data: [{ value: channel.compare, name: channel.name }],
      })
    }
  })

  return {
    backgroundColor: input.background || palette.bg,
    ...animationOf(input.animation !== false),
    title: titleOf(palette, input.title, input.subtitle),
    tooltip: {
      ...itemTooltip(palette),
      formatter(params: unknown) {
        const item = params as { seriesId?: string; value?: number; name?: string }
        const index = Number(String(item.seriesId || '').replace('flow-compare-', '').replace('flow-', ''))
        const channel = channels[index]
        if (!channel) return ''
        const unit = channel.unit || input.unit || ''
        const status = resolveStatus(channel.value, channel.threshold)
        const color = status === 'danger' ? palette.danger : status === 'warning' ? palette.warning : palette.normal
        const lines = [
          `<b>${channel.name}</b>`,
          `实时　${formatNumber(channel.value, 1)} ${unit}`,
          channel.compare != null ? `${input.compareName || '对比'}　${formatNumber(channel.compare, 1)} ${unit}` : '',
          `量程　${formatNumber(channel.min ?? 0, 0)} – ${formatNumber(channel.max ?? 0, 0)} ${unit}`,
          `状态　<span style="color:${color}">${statusText(status)}</span>`,
        ]
        return lines.filter(Boolean).join('<br/>')
      },
    },
    graphic: emptyGraphic(palette, channels.length === 0),
    series,
  }
}

function shiftRule(rule: ThresholdRule | undefined, min: number): ThresholdRule | undefined {
  if (!rule) return undefined
  const move = (value?: number) => (value == null ? undefined : value - min)
  return { lower: move(rule.lower), upper: move(rule.upper), warning: move(rule.warning), danger: move(rule.danger) }
}
