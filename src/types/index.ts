import type { ThemeMode } from '../theme/palette'

export type { ThemeMode }

/** 点位或汇总值相对阈值的状态 */
export type StatusLevel = 'normal' | 'warning' | 'danger'

/** 设备甘特状态 */
export type GanttStatus = 'running' | 'idle' | 'fault' | 'maintain' | 'changeover'

export type SelectStatus = StatusLevel | GanttStatus

export interface TimeRange {
  /** 开始时间，`YYYY-MM-DD HH:mm` 或 ISO */
  start: string
  /** 结束时间 */
  end: string
}

/** 上限、下限与两级告警。warning / danger 优先按“越高越危险”比较 */
export interface ThresholdRule {
  /** 下限，低于则警告 */
  lower?: number
  /** 上限，达到则警告（未单独给 warning 时使用） */
  upper?: number
  warning?: number
  danger?: number
}

export interface ChartSelectPayload {
  chart: 'energy' | 'gantt' | 'oee' | 'load' | 'flow'
  name: string
  seriesName: string
  value: number
  time?: string
  status: SelectStatus
  unit?: string
  raw: Record<string, unknown>
}

export interface ChartFrameProps {
  title?: string
  subtitle?: string
  unit?: string
  xAxisName?: string
  yAxisName?: string
  showLegend?: boolean
  /** 关闭后动画时长为 0，适合同屏大量图表 */
  animation?: boolean
  /** 自动刷新间隔（毫秒）。0 表示不刷新。有外部 data 时只抛 refresh，不改数据 */
  refreshInterval?: number
  theme?: ThemeMode
  /** 传数字视为像素；不传则 100% 自适应外层 */
  width?: string | number
  height?: string | number
  /** 覆盖主题背景 */
  background?: string
  /** 外部时间选择器联动。空则展示全部内置/传入数据 */
  timeRange?: TimeRange | null
  /** 离线静态渲染：关闭动画、关闭轮询、关闭渐进过渡 */
  staticRender?: boolean
  /** 系列色，缺省使用工业主题色板 */
  colors?: string[]
  modelValue?: ChartSelectPayload | null
}

export interface EnergyPoint {
  time: string
  /** 车间名称 -> 能耗 */
  values: Record<string, number>
}

export interface EnergyStackAreaProps extends ChartFrameProps {
  data?: EnergyPoint[]
  /** 对比序列，如昨日同期。以虚线按车间叠加展示 */
  compareData?: EnergyPoint[]
  compareLabel?: string
  /** 合计曲线的告警阈值 */
  threshold?: ThresholdRule
  /** 分车间阈值，用于 tooltip 状态 */
  seriesThreshold?: Record<string, ThresholdRule>
  showTotal?: boolean
}

export interface GanttSegment {
  start: string
  end: string
  status: GanttStatus
  /** 备注，如故障代码、工单号 */
  note?: string
}

export interface GanttDevice {
  name: string
  segments: GanttSegment[]
}

export interface EquipmentGanttProps extends ChartFrameProps {
  data?: GanttDevice[]
  statusColors?: Partial<Record<GanttStatus, string>>
  statusLabels?: Partial<Record<GanttStatus, string>>
}

export interface OeeIndicator {
  name: string
  max?: number
}

export interface OeeSeries {
  name: string
  values: number[]
}

export interface OeeSnapshot {
  time: string
  series: OeeSeries[]
}

export interface OeeRadarProps extends ChartFrameProps {
  indicators?: OeeIndicator[]
  /** 当前对比系列。传入 history 时作为兜底 */
  data?: OeeSeries[]
  /** 按时间存放的快照，供时间选择器联动 */
  history?: OeeSnapshot[]
  /** 目标线，虚线展示 */
  target?: number[]
  targetName?: string
}

export interface LoadPoint {
  time: string
  /** 实时负荷 */
  actual: number
  /** 对比序列，如昨日同期 */
  compare?: number
  /** 预测 */
  forecast?: number
}

export interface PowerLoadProps extends ChartFrameProps {
  data?: LoadPoint[]
  threshold?: ThresholdRule
  actualName?: string
  compareName?: string
  forecastName?: string
  /** 是否绘制对比、预测。缺省：数据里有值才画 */
  showCompare?: boolean
  showForecast?: boolean
}

export interface FlowChannel {
  name: string
  value: number
  /** 对比值，如昨日同一时刻，额外指针 */
  compare?: number
  min?: number
  max?: number
  unit?: string
  threshold?: ThresholdRule
}

export interface FlowSnapshot {
  time: string
  channels: FlowChannel[]
}

export interface FlowGaugeProps extends ChartFrameProps {
  data?: FlowChannel[]
  history?: FlowSnapshot[]
  compareName?: string
}
