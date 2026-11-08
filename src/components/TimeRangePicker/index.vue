<script setup lang="ts">
import { computed } from 'vue'
import type { TimeRange } from '../../types'

const props = withDefaults(
  defineProps<{
    modelValue?: TimeRange | null
    disabled?: boolean
    label?: string
  }>(),
  { label: '时段', disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: TimeRange] }>()

function toLocal(value?: string): string {
  if (!value) return ''
  return value.includes('T') ? value.slice(0, 16) : value.replace(' ', 'T').slice(0, 16)
}

function toText(value: string): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

const start = computed(() => toLocal(props.modelValue?.start))
const end = computed(() => toLocal(props.modelValue?.end))

function update(key: 'start' | 'end', value: string) {
  const next = {
    start: key === 'start' ? toText(value) : props.modelValue?.start || toText(value),
    end: key === 'end' ? toText(value) : props.modelValue?.end || toText(value),
  }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="kb-time">
    <span class="kb-time__label">{{ label }}</span>
    <input class="kb-time__input" type="datetime-local" :disabled="disabled" :value="start" @input="update('start', ($event.target as HTMLInputElement).value)" />
    <span class="kb-time__sep">至</span>
    <input class="kb-time__input" type="datetime-local" :disabled="disabled" :value="end" @input="update('end', ($event.target as HTMLInputElement).value)" />
  </div>
</template>

<style scoped>
.kb-time {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #c5d4e4;
  font-size: 13px;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
.kb-time__label {
  color: #8ea0b5;
}
.kb-time__sep {
  color: #6f8499;
}
.kb-time__input {
  height: 30px;
  padding: 0 8px;
  color: #e7f2fb;
  background: #102033;
  border: 1px solid rgba(0, 212, 255, 0.28);
  border-radius: 4px;
  outline: none;
}
.kb-time__input:focus {
  border-color: #00d4ff;
}
</style>
