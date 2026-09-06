<script lang="ts">
  // CPB 호기 카드(카탈로그 EquipmentCard) — 헤더(호기 · 상태 pill) · 선택적 요약줄(마지막 수신 · 고장코드) · 자식(타일 등) · 액션 슬롯
  import type { Device } from '@boomeyes/domain';
  import type { Snippet } from 'svelte';
  import { EQUIPMENT_TONE, cx } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
  import { EQUIPMENT_LABEL, ERROR_CODE_LABEL } from '../lib/labels';
  import StatusPill from './StatusPill.svelte';
  let {
    device,
    href,
    summary = false,
    size = 'sm',
    class: cls,
    children,
    actions,
  }: {
    device: Device;
    /** 있으면 헤더가 링크(상세로) */
    href?: string;
    /** 현장 · 마지막 수신 · 고장코드 요약줄 */
    summary?: boolean;
    size?: 'sm' | 'md';
    class?: string;
    children?: Snippet;
    actions?: Snippet;
  } = $props();
  const title = $derived(`${device.id} · ${device.unitNo}호기`);
</script>

<section
  class={cx('gap-stack-sm flex flex-col', cls)}
  aria-label="{device.id} 카메라"
  data-device={device.id}
  data-state={device.state}
>
  <div class="flex items-center justify-between">
    {#if href}<a {href} class={cx(size === 'md' ? 'text-heading-md' : 'text-heading-sm', 'text-accent-fg')}>{title} ›</a
      >
    {:else}<h2 class={size === 'md' ? 'text-heading-md' : 'text-heading-sm'}>{title}</h2>{/if}
    <StatusPill tone={EQUIPMENT_TONE[device.state]} label={EQUIPMENT_LABEL[device.state]} {size} />
  </div>
  {#if summary}
    <p class="text-body-sm text-fg-muted">
      마지막 수신 {fmtDateTime(device.telemetry.at)}
      {#if device.telemetry.errorCode}<span class="text-danger-fg">
          · {device.telemetry.errorCode} — {ERROR_CODE_LABEL[device.telemetry.errorCode] ?? '설명 없음'}</span
        >{/if}
    </p>
  {/if}
  {@render children?.()}
  {#if actions}<div class="gap-inline-sm flex flex-wrap">{@render actions()}</div>{/if}
</section>
