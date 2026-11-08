---
title: 组件预览
---

# 工业看板预览

五个组件共用时段、主题和渲染开关。点击图元可在上方看到抛出的选中数据，每个图可单独导出 PNG。

<script setup>
import Gallery from './components/Gallery.vue'
</script>

<ClientOnly>
  <Gallery />
</ClientOnly>
