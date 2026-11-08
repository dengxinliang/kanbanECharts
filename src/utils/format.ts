import type { ThresholdRule, StatusLevel, TimeRange } from '../types'

export function parseTime(input: string | number): number {
  if (typeof input === 'number') return input
  const normalized = input.includes('T') ? input : input.replace(' ', 'T')
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? Date.parse(input) : time
}

export function formatTime(value: string | number): string {
  const time = typeof value === 'number' ? value : parseTime(value)
  if (Number.isNaN(time)) return String(value)
  const date = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function inRange(time: string | number, range?: TimeRange | null): boolean {
  if (!range?.start || !range?.end) return true
  const value = parseTime(time)
  return value >= parseTime(range.start) && value <= parseTime(range.end)
}

export function formatNumber(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '--'
  const fraction = Math.abs(value) >= 100 ? 0 : digits
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })
}

export function resolveStatus(value: number, rule?: ThresholdRule): StatusLevel {
  if (!rule || !Number.isFinite(value)) return 'normal'
  const danger = rule.danger
  const warning = rule.warning ?? rule.upper
  if (danger != null && value >= danger) return 'danger'
  if (warning != null && value >= warning) return 'warning'
  if (rule.lower != null && value <= rule.lower) return 'warning'
  return 'normal'
}

export function statusText(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    danger: '超限',
    running: '运行',
    idle: '待机',
    fault: '故障',
    maintain: '保养',
    changeover: '换型',
  }
  return map[status] ?? status
}

export function nudgePoints<T extends { values?: Record<string, number>; actual?: number }>(rows: T[]): T[] {
  if (!rows.length) return rows
  const next = rows.map((row) => ({ ...row }))
  const last = { ...next[next.length - 1] } as T
  if (last.values) {
    const values: Record<string, number> = {}
    Object.entries(last.values).forEach(([key, value]) => {
      const delta = value * (Math.random() * 0.03 - 0.015)
      values[key] = Math.max(0, Math.round((value + delta) * 10) / 10)
    })
    ;(last as { values: Record<string, number> }).values = values
  }
  if (typeof last.actual === 'number') {
    const delta = last.actual * (Math.random() * 0.02 - 0.01)
    ;(last as { actual: number }).actual = Math.max(0, Math.round((last.actual + delta) * 10) / 10)
  }
  next[next.length - 1] = last
  return next
}

export function cssSize(value?: string | number): string | undefined {
  if (value == null || value === '') return undefined
  return typeof value === 'number' ? `${value}px` : value
}
