<script setup lang="ts">
import { ref } from 'vue'
import EnergyStackArea from '../../src/components/EnergyStackArea/index.vue'
import EquipmentGantt from '../../src/components/EquipmentGantt/index.vue'
import FlowGauge from '../../src/components/FlowGauge/index.vue'
import OeeRadar from '../../src/components/OeeRadar/index.vue'
import PowerLoadCurve from '../../src/components/PowerLoadCurve/index.vue'
import TimeRangePicker from '../../src/components/TimeRangePicker/index.vue'
import type { ChartSelectPayload, ThemeMode, TimeRange } from '../../src/types'

const theme = ref<ThemeMode>('dark')
const animation = ref(true)
const staticRender = ref(false)
const refreshInterval = ref(0)
const range = ref<TimeRange>({ start: '2026-11-08 08:00', end: '2026-11-08 18:00' })
const selected = ref<ChartSelectPayload | null>(null)

const energyRef = ref<{ exportImage: () => string } | null>(null)
const ganttRef = ref<{ exportImage: () => string } | null>(null)
const oeeRef = ref<{ exportImage: () => string } | null>(null)
const loadRef = ref<{ exportImage: () => string } | null>(null)
const flowRef = ref<{ exportImage: () => string } | null>(null)

const presets: Array<{ label: string; value: TimeRange }> = [
  { label: '全班', value: { start: '2026-11-08 08:00', end: '2026-11-08 18:00' } },
  { label: '上午', value: { start: '2026-11-08 08:00', end: '2026-11-08 12:00' } },
  { label: '下午', value: { start: '2026-11-08 12:00', end: '2026-11-08 18:00' } },
]

function save(dataUrl: string, name: string) {
  if (!dataUrl) return
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = name
  link.click()
}

function onSelect(payload: ChartSelectPayload) {
  selected.value = payload
}
</script>

<template>
  <div class="board" :class="theme">
    <div class="toolbar">
      <TimeRangePicker v-model="range" label="联动时段" />
      <button v-for="item in presets" :key="item.label" type="button" @click="range = item.value">{{ item.label }}</button>
      <button type="button" @click="theme = theme === 'dark' ? 'light' : 'dark'">{{ theme === 'dark' ? '浅色' : '深色' }}</button>
      <button type="button" @click="animation = !animation">动画 {{ animation ? '开' : '关' }}</button>
      <button type="button" @click="staticRender = !staticRender">{{ staticRender ? '静态渲染' : '动态渲染' }}</button>
      <label>
        刷新
        <select v-model.number="refreshInterval">
          <option :value="0">关闭</option>
          <option :value="5000">5 秒</option>
          <option :value="10000">10 秒</option>
        </select>
      </label>
    </div>
    <p class="picked">
      选中：
      <template v-if="selected">{{ selected.chart }} / {{ selected.name }} / {{ selected.seriesName }} / {{ selected.value }} {{ selected.unit }} / {{ selected.status }} {{ selected.time || '' }}</template>
      <template v-else>点击图表点位、色块或表盘</template>
    </p>
    <div class="grid">
      <section>
        <div class="pane"><EnergyStackArea ref="energyRef" v-model="selected" :theme="theme" :time-range="range" :animation="animation" :static-render="staticRender" :refresh-interval="refreshInterval" @select="onSelect" /></div>
        <button type="button" @click="save(energyRef?.exportImage() || '', 'energy.png')">导出能耗图</button>
      </section>
      <section>
        <div class="pane"><EquipmentGantt ref="ganttRef" :theme="theme" :time-range="range" :animation="animation" :static-render="staticRender" @select="onSelect" /></div>
        <button type="button" @click="save(ganttRef?.exportImage() || '', 'gantt.png')">导出甘特图</button>
      </section>
      <section>
        <div class="pane"><OeeRadar ref="oeeRef" :theme="theme" :time-range="range" :animation="animation" :static-render="staticRender" @select="onSelect" /></div>
        <button type="button" @click="save(oeeRef?.exportImage() || '', 'oee.png')">导出雷达图</button>
      </section>
      <section>
        <div class="pane"><PowerLoadCurve ref="loadRef" :theme="theme" :time-range="range" :animation="animation" :static-render="staticRender" :refresh-interval="refreshInterval" @select="onSelect" /></div>
        <button type="button" @click="save(loadRef?.exportImage() || '', 'load.png')">导出负荷曲线</button>
      </section>
      <section class="wide">
        <div class="pane"><FlowGauge ref="flowRef" :theme="theme" :time-range="range" :animation="animation" :static-render="staticRender" @select="onSelect" /></div>
        <button type="button" @click="save(flowRef?.exportImage() || '', 'flow.png')">导出流量表</button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.board {
  padding: 12px;
  border-radius: 8px;
  background: #050d18;
  color: #d5e2ef;
}
.board.light {
  background: #e8eef6;
  color: #102033;
}
.toolbar,
section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.toolbar {
  margin-bottom: 8px;
}
button,
select {
  height: 30px;
  padding: 0 10px;
  color: inherit;
  background: transparent;
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 4px;
  cursor: pointer;
}
.picked {
  margin: 8px 0 12px;
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pane {
  width: 100%;
  height: 360px;
}
.wide {
  grid-column: 1 / -1;
}
section {
  align-items: stretch;
  flex-direction: column;
}
@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
