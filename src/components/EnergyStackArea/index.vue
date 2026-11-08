<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIndustrialChart } from '../../composables/useIndustrialChart'
import { buildEnergyAreaOption, ENERGY_COMPARE_DEMO, ENERGY_DEMO, ENERGY_THRESHOLD } from '../../options/energyArea'
import { getPalette } from '../../theme/palette'
import type { ChartSelectPayload, EnergyStackAreaProps } from '../../types'
import { cssSize, formatTime, inRange, nudgePoints, resolveStatus } from '../../utils/format'

const props = withDefaults(defineProps<EnergyStackAreaProps>(), {
  title: '多车间能耗',
  subtitle: '冲压 / 焊接 / 涂装 / 总装 / 动力站 · 小时电耗',
  unit: 'kWh',
  xAxisName: '时间',
  yAxisName: '能耗',
  showLegend: true,
  animation: true,
  refreshInterval: 0,
  theme: 'dark',
  staticRender: false,
  showTotal: true,
  compareLabel: '昨日',
})

const emit = defineEmits<{
  'update:modelValue': [value: ChartSelectPayload | null]
  select: [value: ChartSelectPayload]
  refresh: []
  zoom: [value: { start: string; end: string }]
}>()

const live = ref(ENERGY_DEMO.map((row) => ({ time: row.time, values: { ...row.values } })))

const source = computed(() => (props.data && props.data.length ? props.data : live.value))
const filtered = computed(() => source.value.filter((row) => inRange(row.time, props.timeRange)))
const compare = computed(() => {
  const rows = props.compareData ?? (props.data && props.data.length ? [] : ENERGY_COMPARE_DEMO)
  return rows.filter((row) => inRange(row.time, props.timeRange))
})

const threshold = computed(() => props.threshold ?? (props.data && props.data.length ? undefined : ENERGY_THRESHOLD))

function option() {
  return buildEnergyAreaOption({
    data: filtered.value,
    compareData: compare.value,
    compareLabel: props.compareLabel,
    title: props.title,
    subtitle: props.subtitle,
    unit: props.unit,
    xAxisName: props.xAxisName,
    yAxisName: props.yAxisName,
    showLegend: props.showLegend,
    animation: props.staticRender ? false : props.animation,
    theme: props.theme,
    background: props.background,
    colors: props.colors,
    threshold: threshold.value,
    seriesThreshold: props.seriesThreshold,
    showTotal: props.showTotal,
  })
}

function onClick(params: unknown) {
  const item = params as {
    seriesName?: string
    name?: string
    value?: number | { value?: number }
    data?: { value?: number }
  }
  const rawValue = typeof item.value === 'number' ? item.value : (item.value?.value ?? item.data?.value)
  if (rawValue == null || !item.seriesName || item.seriesName.includes(props.compareLabel)) return
  const rule = item.seriesName === '合计' ? threshold.value : props.seriesThreshold?.[item.seriesName]
  const payload: ChartSelectPayload = {
    chart: 'energy',
    name: item.seriesName,
    seriesName: item.seriesName,
    value: Number(rawValue),
    time: formatTime(String(item.name ?? '')),
    status: resolveStatus(Number(rawValue), rule),
    unit: props.unit,
    raw: { time: item.name, value: Number(rawValue), seriesName: item.seriesName },
  }
  emit('update:modelValue', payload)
  emit('select', payload)
}

function onZoom(payload: { start?: number; end?: number }) {
  const times = filtered.value.map((row) => row.time)
  if (!times.length || payload.start == null || payload.end == null) return
  const last = times.length - 1
  const startIndex = Math.min(last, Math.max(0, Math.round((payload.start / 100) * last)))
  const endIndex = Math.min(last, Math.max(startIndex, Math.round((payload.end / 100) * last)))
  emit('zoom', { start: times[startIndex], end: times[endIndex] })
}

const { el, exportImage, resize } = useIndustrialChart({
  getOption: option,
  refreshInterval: computed(() => props.refreshInterval),
  staticRender: computed(() => props.staticRender),
  watchKey: () => [
    filtered.value,
    compare.value,
    props.theme,
    props.animation,
    props.staticRender,
    props.showLegend,
    props.title,
    props.subtitle,
    props.unit,
    props.colors,
    props.background,
    props.showTotal,
    props.threshold,
    props.seriesThreshold,
  ],
  onRefresh: () => {
    emit('refresh')
    if (!props.data?.length && !props.staticRender) live.value = nudgePoints(live.value)
  },
  onClick,
  onDataZoom: onZoom,
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
