import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kanban ECharts',
  description: 'Vue3 + ECharts 5 工业大屏可视化组件',
  lang: 'zh-CN',
  themeConfig: {
    nav: [
      { text: '预览', link: '/' },
      { text: '接入', link: '/usage' },
    ],
    sidebar: [
      { text: '组件预览', link: '/' },
      { text: '接入说明', link: '/usage' },
    ],
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
    },
    ssr: {
      noExternal: ['echarts'],
    },
  },
})
