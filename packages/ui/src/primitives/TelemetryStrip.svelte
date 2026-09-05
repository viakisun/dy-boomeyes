<script lang="ts">
  // 텔레메트리 요약 스트립 — 통신 · 전압 · 단선 · 고장코드 (색 + 텍스트, FR-002)
  import type { Device } from '@boomeyes/domain';
  import { cx, type Tone } from '../lib/cx';
  import StatusDot from './StatusDot.svelte';
  let { telemetry, class: cls }: { telemetry: Device['telemetry']; class?: string } = $props();
  const LTE: Record<Device['telemetry']['lte'], { tone: Tone; text: string }> = {
    connected: { tone: 'success', text: '연결' },
    weak: { tone: 'warning', text: '약함' },
    lost: { tone: 'danger', text: '두절' },
  };
  const cells = $derived([
    { label: '통신(LTE)', tone: LTE[telemetry.lte].tone, text: LTE[telemetry.lte].text },
    {
      label: '전압',
      tone: (telemetry.voltageStatus === 'normal' ? 'success' : 'danger') as Tone,
      text: `${telemetry.voltage}V · ${telemetry.voltageStatus === 'normal' ? '정상' : '이상'}`,
    },
    {
      label: '단선',
      tone: (telemetry.harness === 'ok' ? 'success' : 'danger') as Tone,
      text: telemetry.harness === 'ok' ? '정상' : '단선',
    },
    {
      label: '고장코드',
      tone: (telemetry.errorCode ? 'danger' : 'success') as Tone,
      text: telemetry.errorCode ?? '없음',
    },
  ]);
</script>

<dl class={cx('gap-inline-sm grid grid-cols-2', cls)} aria-label="텔레메트리">
  {#each cells as c (c.label)}
    <div class="rounded-control bg-surface-sunken p-inset-sm gap-stack-xs flex flex-col">
      <dt class="text-label-sm text-fg-muted">{c.label}</dt>
      <dd class="gap-inline-xs text-body-md flex items-center font-medium">
        <StatusDot tone={c.tone} />{c.text}
      </dd>
    </div>
  {/each}
</dl>
