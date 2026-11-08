import type { EChartsCoreOption } from 'echarts'
import type { GanttDevice, GanttStatus } from '../types'
import type { Palette, ThemeMode } from '../theme/palette'
import { getPalette } from '../theme/palette'
import { formatTime, parseTime, statusText } from '../utils/format'
import { animationOf, emptyGraphic, legendOf, titleOf, itemTooltip } from './common'

export interface GanttOptionInput {
  data: GanttDevice[]
  title?: string
  subtitle?: string
  showLegend?: boolean
  animation?: boolean
  theme?: ThemeMode
  background?: string
  xAxisName?: string
  yAxisName?: string
  statusColors?: Partial<Record<GanttStatus, string>>
  statusLabels?: Partial<Record<GanttStatus, string>>
}

export const GANTT_STATUS_LABEL: Record<GanttStatus, string> = {
  running: '运行',
  idle: '待机',
  fault: '故障',
  maintain: '保养',
  changeover: '换型',
}

export function ganttColors(palette: Palette, custom?: Partial<Record<GanttStatus, string>>): Record<GanttStatus, string> {
  return {
    running: custom?.running || palette.normal,
    idle: custom?.idle || palette.idle,
    fault: custom?.fault || palette.danger,
    maintain: custom?.maintain || palette.warning,
    changeover: custom?.changeover || palette.primary,
    ...custom,
  }
}

const DAY = '2026-11-08'

export const GANTT_DEMO: GanttDevice[] = [
  {
    name: '冲压线 A-01',
    segments: [
      { start: `${DAY} 08:00`, end: `${DAY} 10:20`, status: 'running' },
      { start: `${DAY} 10:20`, end: `${DAY} 10:48`, status: 'changeover', note: '模具 M-204 换型' },
      { start: `${DAY} 10:48`, end: `${DAY} 12:00`, status: 'running' },
      { start: `${DAY} 12:00`, end: `${DAY} 12:40`, status: 'idle', note: '用餐停机' },
      { start: `${DAY} 12:40`, end: `${DAY} 15:05`, status: 'running' },
      { start: `${DAY} 15:05`, end: `${DAY} 16:10`, status: 'fault', note: '送料异常 ALM-17' },
      { start: `${DAY} 16:10`, end: `${DAY} 18:00`, status: 'running' },
    ],
  },
  {
    name: '焊接机器人 R-03',
    segments: [
      { start: `${DAY} 08:00`, end: `${DAY} 11:30`, status: 'running' },
      { start: `${DAY} 11:30`, end: `${DAY} 12:10`, status: 'changeover', note: '夹具切换' },
      { start: `${DAY} 12:10`, end: `${DAY} 12:45`, status: 'idle' },
      { start: `${DAY} 12:45`, end: `${DAY} 17:20`, status: 'running' },
      { start: `${DAY} 17:20`, end: `${DAY} 18:00`, status: 'maintain', note: '焊枪导电嘴点检' },
    ],
  },
  {
    name: '涂装烘房 H-2',
    segments: [
      { start: `${DAY} 08:00`, end: `${DAY} 12:00`, status: 'running' },
      { start: `${DAY} 12:00`, end: `${DAY} 12:30`, status: 'idle' },
      { start: `${DAY} 12:30`, end: `${DAY} 16:40`, status: 'running' },
      { start: `${DAY} 16:40`, end: `${DAY} 17:25`, status: 'fault', note: '炉温超差 T-HIGH' },
      { start: `${DAY} 17:25`, end: `${DAY} 18:00`, status: 'running' },
    ],
  },
  {
    name: '总装工位 T-12',
    segments: [
      { start: `${DAY} 08:10`, end: `${DAY} 09:00`, status: 'changeover', note: '车型切换 A→B' },
      { start: `${DAY} 09:00`, end: `${DAY} 12:00`, status: 'running' },
      { start: `${DAY} 12:00`, end: `${DAY} 12:40`, status: 'idle' },
      { start: `${DAY} 12:40`, end: `${DAY} 15:30`, status: 'running' },
      { start: `${DAY} 15:30`, end: `${DAY} 16:00`, status: 'maintain', note: '拧紧枪校准' },
      { start: `${DAY} 16:00`, end: `${DAY} 18:00`, status: 'running' },
    ],
  },
  {
    name: '空压机 C-1',
    segments: [
      { start: `${DAY} 08:00`, end: `${DAY} 14:20`, status: 'running' },
      { start: `${DAY} 14:20`, end: `${DAY} 14:50`, status: 'idle', note: '卸载' },
      { start: `${DAY} 14:50`, end: `${DAY} 18:00`, status: 'running' },
    ],
  },
]

interface GanttDatum {
  value: [number, number, number]
  device: string
  status: GanttStatus
  note?: string
  itemStyle: { color: string }
}

function renderBar(_params: unknown, api: {
  value: (dim: number) => number
  coord: (point: number[]) => number[]
  size: (dim: number[]) => number[]
  visual: (key: string) => unknown
}) {
  const category = api.value(0)
  const start = api.coord([api.value(1), category])
  const end = api.coord([api.value(2), category])
  const band = api.size([0, 1])[1] * 0.56
  const width = Math.max(end[0] - start[0], 2)
  const fill = String(api.visual('color') || '#36d399')
  return {
    type: 'rect',
    shape: { x: start[0], y: start[1] - band / 2, width, height: band, r: 2 },
    style: { fill, shadowBlur: 8, shadowColor: fill },
  }
}

export function buildEquipmentGanttOption(input: GanttOptionInput): EChartsCoreOption {
  const palette = getPalette(input.theme ?? 'dark')
  const labels = { ...GANTT_STATUS_LABEL, ...input.statusLabels }
  const colors = ganttColors(palette, input.statusColors)
  const devices = input.data ?? []
  const categories = devices.map((item) => item.name)
  const grouped: Record<GanttStatus, GanttDatum[]> = {
    running: [],
    idle: [],
    fault: [],
    maintain: [],
    changeover: [],
  }

  devices.forEach((device, index) => {
    device.segments.forEach((segment) => {
      const start = parseTime(segment.start)
      const end = parseTime(segment.end)
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return
      grouped[segment.status].push({
        value: [index, start, end],
        device: device.name,
        status: segment.status,
        note: segment.note,
        itemStyle: { color: colors[segment.status] },
      })
    })
  })

  const statuses = Object.keys(grouped) as GanttStatus[]
  const series = statuses.map((status) => ({
    name: labels[status],
    type: 'custom',
    renderItem: renderBar,
    encode: { x: [1, 2], y: 0 },
    itemStyle: { color: colors[status] },
    data: grouped[status],
  }))

  const stamps = devices.flatMap((device) => device.segments.flatMap((segment) => [parseTime(segment.start), parseTime(segment.end)]))
  const min = stamps.length ? Math.min(...stamps) : undefined
  const max = stamps.length ? Math.max(...stamps) : undefined

  return {
    backgroundColor: input.background || palette.bg,
    ...animationOf(input.animation !== false),
    title: titleOf(palette, input.title, input.subtitle),
    legend: { ...legendOf(palette, input.showLegend !== false), data: statuses.map((status) => labels[status]) },
    tooltip: {
      ...itemTooltip(palette),
      formatter(params: unknown) {
        const item = params as { data?: GanttDatum; color?: string }
        const data = item.data
        if (!data) return ''
        const minutes = Math.round((data.value[2] - data.value[1]) / 60000)
        const color = item.color || colors[data.status]
        return [
          `<b>${data.device}</b>`,
          `<span style="color:${color}">${labels[data.status]}</span> · ${statusText(data.status)}`,
          `${formatTime(data.value[1])} → ${formatTime(data.value[2])}`,
          `持续 ${minutes} 分钟`,
          data.note ? `备注 ${data.note}` : '',
        ]
          .filter(Boolean)
          .join('<br/>')
      },
    },
    grid: { left: 118, right: 24, top: 72, bottom: 48 },
    xAxis: {
      type: 'time',
      min,
      max,
      name: input.xAxisName || '',
      nameTextStyle: { color: palette.axis },
      axisLine: { lineStyle: { color: palette.grid } },
      axisLabel: { color: palette.text, fontSize: 11, formatter: (value: number) => formatTime(value).slice(11, 16) },
      splitLine: { show: true, lineStyle: { color: palette.grid, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      name: input.yAxisName || '',
      data: categories,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: palette.legend, fontSize: 12 },
      splitLine: { show: false },
    },
    dataZoom: devices.length
      ? [{ type: 'inside', filterMode: 'none', throttle: 50 }]
      : [],
    graphic: emptyGraphic(palette, devices.length === 0),
    series,
  }
}
