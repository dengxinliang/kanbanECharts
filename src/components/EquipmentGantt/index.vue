<script setup lang="ts">
import { computed } from 'vue'
import { useIndustrialChart } from '../../composables/useIndustrialChart'
import { buildEquipmentGanttOption, GANTT_DEMO, GANTT_STATUS_LABEL } from '../../options/equipmentGantt'
import { getPalette } from '../../theme/palette'
import type { ChartSelectPayload, EquipmentGanttProps, GanttDevice, GanttStatus } from '../../types'
import { cssSize, formatTime, parseTime } from '../../utils/format'

const props = withDefaults(defineProps<EquipmentGanttProps>(), {
  title: '设备状态',
  subtitle: '冲压 / 焊接 / 涂装 / 总装 / 动力 · 当班',
  showLegend: true,
  animation: true,
  refreshInterval: 0,
  theme: 'dark',
  staticRender: false,
  xAxisName: '时间',
  yAxisName: '设备',
})

const emit = defineEmits<{
  'update:modelValue': [value: ChartSelectPayload | null]
  select: [value: ChartSelectPayload]
  refresh: []
}>()

function clip(devices: GanttDevice[]): GanttDevice[] {
  const range = props.timeRange
  if (!range?.start || !range?.end) return devices
  const start = parseTime(range.start)
  const end = parseTime(range.end)
  return devices
    .map((device) => ({
      ...device,
      segments: device.segments.flatMap((segment) => {
        const from = Math.max(parseTime(segment.start), start)
        const to = Math.min(parseTime(segment.end), end)
        if (to <= from) return []
        return [{ ...segment, start: formatTime(from), end: formatTime(to) }]
      }),
    }))
    .filter((device) => device.segments.length)
}

const view = computed(() => clip(props.data && props.data.length ? props.data : GANTT_DEMO))

function option() {
  return buildEquipmentGanttOption({
    data: view.value,
    title: props.title,
    subtitle: props.subtitle,
    showLegend: props.showLegend,
    animation: props.staticRender ? false : props.animation,
    theme: props.theme,
    background: props.background,
    xAxisName: props.xAxisName,
    yAxisName: props.yAxisName,
    statusColors: props.statusColors,
    statusLabels: props.statusLabels,
  })
}

function onClick(params: unknown) {
  const item = params as {
    data?: { device?: string; status?: GanttStatus; note?: string; value?: [number, number, number] }
  }
  const data = item.data
  if (!data?.device || !data.status || !data.value) return
  const payload: ChartSelectPayload = {
    chart: 'gantt',
    name: data.device,
    seriesName: props.statusLabels?.[data.status] || GANTT_STATUS_LABEL[data.status],
    value: Math.round((data.value[2] - data.value[1]) / 60000),
    time: formatTime(data.value[1]),
    status: data.status,
    unit: '分钟',
    raw: {
      device: data.device,
      status: data.status,
      start: formatTime(data.value[1]),
      end: formatTime(data.value[2]),
      note: data.note ?? '',
    },
  }
  emit('update:modelValue', payload)
  emit('select', payload)
}

const { el, exportImage, resize } = useIndustrialChart({
  getOption: option,
  refreshInterval: computed(() => props.refreshInterval),
  staticRender: computed(() => props.staticRender),
  watchKey: () => [view.value, props.theme, props.animation, props.staticRender, props.showLegend, props.title, props.background, props.statusColors],
  onRefresh: () => emit('refresh'),
  onClick,
})

const boxStyle = computed(() => ({
  width: cssSize(props.width) ?? '100%',
  height: cssSize(props.height) ?? '100%',
  minHeight: props.height ? '0' : '280px',
  background: props.background || getPalette(props.theme).bg,
}))

defineExpose({ exportImage, resize, getOption: option })
</script>

<template>
  <div ref="el" class="kb-chart" :style="boxStyle" />
</template>

<style scoped>
.kb-chart {
  width: 100%;
  height: 100%;
  min-height: 280px;
}
</style>
