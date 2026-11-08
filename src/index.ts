export type { Palette, ThemeMode } from './theme/palette'
export { DARK, LIGHT, getPalette, getSeriesColors } from './theme/palette'

export type {
  ChartFrameProps,
  ChartSelectPayload,
  EnergyPoint,
  EnergyStackAreaProps,
  EquipmentGanttProps,
  FlowChannel,
  FlowGaugeProps,
  FlowSnapshot,
  GanttDevice,
  GanttSegment,
  GanttStatus,
  LoadPoint,
  OeeIndicator,
  OeeRadarProps,
  OeeSeries,
  OeeSnapshot,
  PowerLoadProps,
  SelectStatus,
  StatusLevel,
  ThresholdRule,
  TimeRange,
} from './types'

export { buildEnergyAreaOption, ENERGY_COMPARE_DEMO, ENERGY_DEMO, ENERGY_THRESHOLD } from './options/energyArea'
export type { EnergyAreaOptionInput } from './options/energyArea'
export { buildEquipmentGanttOption, GANTT_DEMO, GANTT_STATUS_LABEL, ganttColors } from './options/equipmentGantt'
export type { GanttOptionInput } from './options/equipmentGantt'
export { buildOeeRadarOption, OEE_DEMO, OEE_HISTORY, OEE_INDICATORS, OEE_TARGET } from './options/oeeRadar'
export type { OeeRadarOptionInput } from './options/oeeRadar'
export { buildPowerLoadOption, LOAD_DEMO, LOAD_THRESHOLD } from './options/powerLoad'
export type { PowerLoadOptionInput } from './options/powerLoad'
export { buildFlowGaugeOption, FLOW_DEMO, FLOW_HISTORY } from './options/flowGauge'
export type { FlowGaugeOptionInput } from './options/flowGauge'

export { default as EnergyStackArea } from './components/EnergyStackArea/index.vue'
export { default as EquipmentGantt } from './components/EquipmentGantt/index.vue'
export { default as OeeRadar } from './components/OeeRadar/index.vue'
export { default as PowerLoadCurve } from './components/PowerLoadCurve/index.vue'
export { default as FlowGauge } from './components/FlowGauge/index.vue'
export { default as TimeRangePicker } from './components/TimeRangePicker/index.vue'
