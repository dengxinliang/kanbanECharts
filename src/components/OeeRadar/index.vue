<script setup lang="ts">
import { computed } from 'vue'
import { useIndustrialChart } from '../../composables/useIndustrialChart'
import { buildOeeRadarOption, OEE_DEMO, OEE_HISTORY, OEE_INDICATORS, OEE_TARGET } from '../../options/oeeRadar'
import { getPalette } from '../../theme/palette'
import type { ChartSelectPayload, OeeRadarProps, StatusLevel } from '../../types'
import { cssSize, inRange } from '../../utils/format'

const props = withDefaults(defineProps<OeeRadarProps>(), {
  title: '产线 OEE',
  subtitle: '稼动、性能、质量与计划达成对比',
  unit: '%',
  showLegend: true,
  animation: true,
  refreshInterval: 0,
  theme: 'dark',
  staticRender: false,
  targetName: '目标',
})

const emit = defineEmits<{
  'update:modelValue': [value: ChartSelectPayload | null]
  select: [value: ChartSelectPayload]
  refresh: []
}>()

const usingDemo = computed(() => !props.data?.length && !props.history?.length)

const series = computed(() => {
  const history = props.history?.length ? props.history : usingDemo.value ? OEE_HISTORY : []
  if (props.timeRange?.start && history.length) {
    const rows = history.filter((item) => inRange(item.time, props.timeRange))
    return rows.length ? rows[rows.length - 1].series : []
  }
  if (props.data?.length) return props.data
  if (history.length) return history[history.length - 1].series
  return OEE_DEMO
})

const indicators = computed(() => (props.indicators?.length ? props.indicators : OEE_INDICATORS))
const target = computed(() => props.target ?? (usingDemo.value ? OEE_TARGET : undefined))

function levelOf(value: number): StatusLevel {
  const danger = 75
  const warning = 85
  if (value < danger) return 'danger'
  if (value < warning) return 'warning'
  return 'normal'
}

function option() {
  return buildOeeRadarOption({
    indicators: indicators.value,
    series: series.value,
    target: target.value,
    targetName: props.targetName,
    title: props.title,
    subtitle: props.subtitle,
    unit: props.unit,
    showLegend: props.showLegend,
    animation: props.staticRender ? false : props.animation,
    theme: props.theme,
    background: props.background,
    colors: props.colors,
    threshold: { warning: 85, danger: 75 },
  })
}

function onClick(params: unknown) {
  const item = params as { name?: string; value?: number[]; dataIndex?: number }
  if (!item.name || !item.value) return
  const index = item.value.reduce((picked, value, current) => (value < item.value![picked] ? current : picked), 0)
  const payload: ChartSelectPayload = {
    chart: 'oee',
    name: item.name,
    seriesName: indicators.value[index]?.name ?? item.name,
    value: item.value[index],
    status: levelOf(item.value[index]),
    unit: props.unit,
    raw: {
      series: item.name,
      values: item.value,
      weakest: indicators.value[index]?.name ?? '',
    },
  }
  emit('update:modelValue', payload)
  emit('select', payload)
}

const { el, exportImage, resize } = useIndustrialChart({
  getOption: option,
  refreshInterval: computed(() => props.refreshInterval),
  staticRender: computed(() => props.staticRender),
  watchKey: () => [series.value, indicators.value, target.value, props.theme, props.animation, props.staticRender, props.showLegend, props.title, props.colors, props.background],
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
