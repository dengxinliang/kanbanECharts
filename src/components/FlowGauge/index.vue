<script setup lang="ts">
import { computed } from 'vue'
import { useIndustrialChart } from '../../composables/useIndustrialChart'
import { buildFlowGaugeOption, FLOW_DEMO, FLOW_HISTORY } from '../../options/flowGauge'
import { getPalette } from '../../theme/palette'
import type { ChartSelectPayload, FlowGaugeProps } from '../../types'
import { cssSize, inRange, resolveStatus } from '../../utils/format'

const props = withDefaults(defineProps<FlowGaugeProps>(), {
  title: '管道流量',
  subtitle: '循环水 / 压缩空气 / 冷冻水',
  unit: '',
  showLegend: true,
  animation: true,
  refreshInterval: 0,
  theme: 'dark',
  staticRender: false,
  compareName: '对比',
})

const emit = defineEmits<{
  'update:modelValue': [value: ChartSelectPayload | null]
  select: [value: ChartSelectPayload]
  refresh: []
}>()

const usingDemo = computed(() => !props.data?.length && !props.history?.length)

const channels = computed(() => {
  const history = props.history?.length ? props.history : usingDemo.value ? FLOW_HISTORY : []
  if (props.timeRange?.start && history.length) {
    const rows = history.filter((item) => inRange(item.time, props.timeRange))
    return rows.length ? rows[rows.length - 1].channels : []
  }
  if (props.data?.length) return props.data
  if (history.length) return history[history.length - 1].channels
  return FLOW_DEMO
})

function option() {
  return buildFlowGaugeOption({
    channels: channels.value,
    title: props.title,
    subtitle: props.subtitle,
    unit: props.unit,
    showLegend: props.showLegend,
    animation: props.staticRender ? false : props.animation,
    theme: props.theme,
    background: props.background,
    compareName: props.compareName,
  })
}

function onClick(params: unknown) {
  const item = params as { seriesId?: string; value?: number; name?: string }
  const index = Number(String(item.seriesId || '').replace('flow-compare-', '').replace('flow-', ''))
  const channel = channels.value[index]
  if (!channel) return
  const payload: ChartSelectPayload = {
    chart: 'flow',
    name: channel.name,
    seriesName: String(item.seriesId || '').includes('compare') ? props.compareName : channel.name,
    value: Number(item.value ?? channel.value),
    status: resolveStatus(channel.value, channel.threshold),
    unit: channel.unit || props.unit,
    raw: { ...channel },
  }
  emit('update:modelValue', payload)
  emit('select', payload)
}

const { el, exportImage, resize } = useIndustrialChart({
  getOption: option,
  refreshInterval: computed(() => props.refreshInterval),
  staticRender: computed(() => props.staticRender),
  watchKey: () => [channels.value, props.theme, props.animation, props.staticRender, props.showLegend, props.title, props.background, props.compareName],
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
