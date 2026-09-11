<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { OWNER_CONNECTION, OWNER_DEPLOYMENT, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
  import { fmtDateTime } from '../lib/format';
  import { equipmentCondition, ownerControl } from './core-helpers';
  let {
    device,
    href,
    app,
    onselect,
    location = false,
  }: {
    device: OwnerDevice;
    href: string;
    app: OwnerApp;
    onselect?: (device: OwnerDevice) => void;
    location?: boolean;
  } = $props();
  const condition = $derived(equipmentCondition(device));
</script>

<a
  {href}
  data-device={device.id}
  aria-label="{device.unit}호기 {device.id} {device.site} 상세 보기"
  class="{ownerControl(
    app,
  )} gap-inline-md px-inset-lg py-inset-md hover:bg-ui-hover grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center transition-colors sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
  onclick={(event) => {
    if (onselect && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      onselect(device);
    }
  }}
>
  <div class="gap-stack-xs flex min-w-0 flex-col">
    <p class="gap-inline-sm flex flex-wrap items-baseline">
      <span class="text-heading-sm">{device.unit}호기</span>
      <span class="text-code-sm text-fg-muted">{device.id}</span>
      <span class="text-body-sm text-fg-muted">{OWNER_DEPLOYMENT[device.deployment]}</span>
    </p>
    <p class="text-body-md break-words">{device.site || '위치 미등록'}</p>
    {#if location}
      <p class="text-body-sm text-fg-muted break-words">{device.location ? device.address : 'GPS 위치 미확인'}</p>
    {/if}
  </div>
  <div class="gap-stack-xs col-start-1 flex min-w-0 flex-col sm:col-start-auto">
    <p
      class="text-body-md break-words {condition.tone === 'danger'
        ? 'text-danger-fg'
        : condition.tone === 'warning'
          ? 'text-warning-fg'
          : 'text-fg'}"
    >
      {condition.label}
    </p>
    <p class="text-body-sm text-fg-muted">
      {#if device.connection === 'current' && device.receivedAt}
        최근 수신 {fmtDateTime(device.receivedAt)}
      {:else if device.connection === 'stale' && device.receivedAt}
        마지막 수신 {fmtDateTime(device.receivedAt)}
      {:else}
        {OWNER_CONNECTION[device.connection]} · 현재 상태 확인 불가
      {/if}
    </p>
  </div>
  <ChevronRight
    class="text-fg-muted size-size-icon-md col-start-2 row-start-1 shrink-0 sm:col-start-3"
    aria-hidden="true"
  />
</a>
