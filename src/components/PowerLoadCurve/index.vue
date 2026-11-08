<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIndustrialChart } from '../../composables/useIndustrialChart'
import { buildPowerLoadOption, LOAD_DEMO, LOAD_THRESHOLD } from '../../options/powerLoad'
import { getPalette } from '../../theme/palette'
import type { ChartSelectPayload, PowerLoadProps } from '../../types'
import { cssSize, formatTime, inRange, resolveStatus } from '../../utils/format'

const props = withDefaults(defineProps<PowerLoadProps>(), {
  title: '电力负荷',
  subtitle: '10kV 进线 · 实时 / 昨日 / 预测',
  unit: 'kW',
  xAxisName: '时间',
  yAxisName: '负荷',
  showLegend: true,
  animation: true,
  refreshInterval: 0,
  theme: 'dark',
  staticRender: false,
  actualName: '实时负荷',
  compareName: '昨日同期',
  forecastName: '预测负荷',
})

const emit = defineEmits<{
  'update:modelValue': [value: ChartSelectPayload | null]
  select: [value: ChartSelectPayload]
  refresh: []
  zoom: [value: { start: string; end: string }]
}>()

const live = ref(LOAD_DEMO.map((row) => ({ ...row })))
const source = computed(() => (props.data && props.data.length ? props.data : live.value))
const filtered = computed(() => source.value.filter((row) => inRange(row.time, props.timeRange)))
const threshold = computed(() => props.threshold ?? (props.data && props.data.length ? undefined : LOAD_THRESHOLD))

function option() {
  return buildPowerLoadOption({
    data: filtered.value,
    title: props.title,
    subtitle: props.subtitle,
    unit: props.unit,
    xAxisName: props.xAxisName,
    yAxisName: props.yAxisName,
    showLegend: props.showLegend,
    animation: props.staticRender ? false : props.animation,
    theme: props.theme,
    background: props.background,
    threshold: threshold.value,
    actualName: props.actualName,
    compareName: props.compareName,
    forecastName: props.forecastName,
    showCompare: props.showCompare,
    showForecast: props.showForecast,
  })
}

function onClick(params: unknown) {
  const item = params as { seriesName?: string; name?: string; value?: number | { value?: number } }
  const rawValue = typeof item.value === 'number' ? item.value : item.value?.value
  if (rawValue == null || !item.seriesName) return
  const status = item.seriesName === props.actualName ? resolveStatus(Number(rawValue), threshold.value) : 'normal'
  const payload: ChartSelectPayload = {
    chart: 'load',
    name: item.seriesName,
    seriesName: item.seriesName,
    value: Number(rawValue),
    time: formatTime(String(item.name ?? '')),
    status,
    unit: props.unit,
    raw: { time: item.name, value: Number(rawValue) },
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
  watchKey: () => [filtered.value, props.theme, props.animation, props.staticRender, props.showLegend, props.title, props.threshold, props.background, props.colors],
  onRefresh: () => {
    emit('refresh')
    if (props.data?.length || props.staticRender) return
    const next = live.value.map((row) => ({ ...row }))
    const last = next[next.length - 1]
    if (last) last.actual = Math.max(0, Math.round(last.actual * (1 + (Math.random() * 0.02 - 0.01))))
    live.value = next
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
