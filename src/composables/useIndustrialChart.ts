import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { ECharts, EChartsCoreOption } from 'echarts'

interface UseChartOptions {
  getOption: () => EChartsCoreOption
  refreshInterval: Ref<number>
  staticRender: Ref<boolean>
  watchKey: () => unknown
  onRefresh?: () => void
  onClick?: (params: unknown) => void
  onDataZoom?: (payload: { start?: number; end?: number; startValue?: string | number; endValue?: string | number }) => void
}

export function useIndustrialChart(options: UseChartOptions) {
  const el = ref<HTMLElement | null>(null)
  let chart: ECharts | null = null
  let timer = 0
  let observer: ResizeObserver | null = null
  let disposed = false

  function apply() {
    if (!chart || disposed) return
    chart.setOption(options.getOption(), { notMerge: true })
  }

  function bindRefresh() {
    window.clearInterval(timer)
    const interval = options.refreshInterval.value
    if (options.staticRender.value || !interval || interval < 1000) return
    timer = window.setInterval(() => options.onRefresh?.(), interval)
  }

  function readZoom(event: unknown) {
    const raw = event as {
      start?: number
      end?: number
      startValue?: string | number
      endValue?: string | number
      batch?: Array<{ start?: number; end?: number; startValue?: string | number; endValue?: string | number }>
    }
    const payload = raw.batch?.[0] ?? raw
    options.onDataZoom?.(payload)
  }

  async function mount() {
    if (!el.value) return
    const echarts = await import('echarts')
    if (disposed || !el.value) return
    chart = echarts.init(el.value, undefined, { renderer: 'canvas', useDirtyRect: true })
    chart.on('click', (params: unknown) => options.onClick?.(params))
    chart.on('datazoom', (event: unknown) => readZoom(event))
    apply()
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(el.value)
    bindRefresh()
  }

  onMounted(() => {
    void mount()
  })

  onBeforeUnmount(() => {
    disposed = true
    window.clearInterval(timer)
    observer?.disconnect()
    observer = null
    chart?.dispose()
    chart = null
  })

  watch(options.watchKey, () => apply(), { deep: true })
  watch([options.refreshInterval, options.staticRender], () => bindRefresh())

  function exportImage(pixelRatio = 2): string {
    if (!chart) return ''
    const option = options.getOption()
    const background = typeof option.backgroundColor === 'string' ? option.backgroundColor : '#081424'
    return chart.getDataURL({ type: 'png', pixelRatio, backgroundColor: background })
  }

  function resize() {
    chart?.resize()
  }

  return { el, exportImage, resize }
}
