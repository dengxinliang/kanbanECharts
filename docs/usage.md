---
title: 接入
---

# 接入

```ts
import { EnergyStackArea, EquipmentGantt, OeeRadar, PowerLoadCurve, FlowGauge, TimeRangePicker } from 'kanban-echarts'
```

本地文档站：

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。参数、事件和示例以仓库根目录 `README.md` 为准。

不使用 Vue 时，直接调用 `buildEnergyAreaOption`、`buildEquipmentGanttOption`、`buildOeeRadarOption`、`buildPowerLoadOption`、`buildFlowGaugeOption`，把返回值交给任意 ECharts 5 实例。
