<script lang="ts">
  // 미접수 경과 — 임계(기본 1h) 넘으면 danger, 아니면 warning. 색 + 텍스트
  import { elapsedLabel } from '../lib/format';
  import StatusPill from './StatusPill.svelte';
  let {
    elapsedMs,
    thresholdMs = 3_600_000,
    class: cls,
  }: { elapsedMs: number; thresholdMs?: number; class?: string } = $props();
  const over = $derived(elapsedMs >= thresholdMs);
</script>

<StatusPill
  tone={over ? 'danger' : 'warning'}
  label="{elapsedLabel(elapsedMs)} 경과{over ? ' · 임계 초과' : ''}"
  size="sm"
  class={cls}
/>
