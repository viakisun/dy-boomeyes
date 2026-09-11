<script lang="ts">
  // 장비 행/카드 — 미디어(스틸 또는 IconTile) · 식별(호기 + id) · 현장 · 배치 Badge · 조건 StatusPill · 수신(시계 + 상대/절대) · 계약 D-n · 후행.
  // layout columns = 웹 목록(≥ sm 정렬 열) · stacked = 현황·진입(스택). 색 예산: 필은 warning·danger만.
  import type { Snippet } from 'svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Truck from '@lucide/svelte/icons/truck';
  import Clock from '@lucide/svelte/icons/clock';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Check from '@lucide/svelte/icons/check';
  import { OWNER_CONNECTION, OWNER_DEPLOYMENT, type OwnerDevice } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import { dueLabel, fmtDateTime, relativeLabel } from '../lib/format';
  import Badge from '../primitives/Badge.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import { equipmentCondition, ownerControl } from './core-helpers';
  let {
    device,
    now,
    href,
    onselect,
    layout = 'stacked',
    poster = null,
    location = false,
    actions,
    class: cls,
  }: {
    device: OwnerDevice;
    /** DemoClock(data.at) */
    now: string;
    href?: string;
    onselect?: (device: OwnerDevice) => void;
    layout?: 'columns' | 'stacked';
    /** 대표 스틸 URL — 없으면 IconTile */
    poster?: string | null;
    location?: boolean;
    actions?: Snippet;
    class?: string;
  } = $props();
  const condition = $derived(equipmentCondition(device));
  const due = $derived(device.contract ? dueLabel(device.contract.to, new Date(now)) : null);
  const dueSoon = $derived(due ? due.overdue || Number(due.label.replace('D-', '')) <= 30 : false);
  const columns = $derived(layout === 'columns');
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  {href}
  data-device={device.id}
  data-condition={condition.tone}
  aria-label={href ? `${device.unit}호기 ${device.id} ${device.site} 상세 보기` : undefined}
  class={cx(
    ownerControl(),
    'gap-inline-md px-inset-md py-inset-sm grid min-w-0 items-center transition-colors',
    href && 'hover:bg-ui-hover',
    columns
      ? 'grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_minmax(0,3fr)_minmax(0,2.4fr)_minmax(0,2fr)_minmax(0,1.4fr)_auto]'
      : 'grid-cols-[auto_minmax(0,1fr)_auto]',
    cls,
  )}
  onclick={(event: MouseEvent) => {
    if (onselect && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      onselect(device);
    }
  }}
>
  {#if poster}
    <img
      src={poster}
      alt=""
      loading="lazy"
      class="rounded-control bg-media-bg w-layout-field-short aspect-video object-cover"
    />
  {:else}
    <IconTile><Truck class="size-size-icon-lg" /></IconTile>
  {/if}
  <span class="gap-stack-xs flex min-w-0 flex-col">
    <span class="gap-inline-sm flex flex-wrap items-baseline">
      <span class="text-heading-sm">{device.unit}호기</span>
      <span class="text-code-sm text-fg-muted">{device.id}</span>
      {#if !columns}<Badge variant="outline">{OWNER_DEPLOYMENT[device.deployment]}</Badge>{/if}
    </span>
    <span class="text-body-md break-words">{device.site || '위치 미등록'}</span>
    {#if location}<span class="text-body-sm text-fg-muted break-words"
        >{device.location ? device.address : 'GPS 위치 미확인'}</span
      >{/if}
    {#if !columns}
      <span class="gap-inline-sm text-body-sm text-fg-muted flex flex-wrap items-center">
        <StatusPill size="sm" tone={condition.tone} label={condition.label}>
          {#snippet icon()}{#if condition.tone === 'neutral'}<Check
                class="size-size-icon-sm"
                aria-hidden="true"
              />{/if}{/snippet}
        </StatusPill>
      </span>
    {/if}
  </span>
  {#if columns}
    <span class="col-start-2 flex min-w-0 flex-wrap items-center sm:col-start-auto"
      ><StatusPill size="sm" tone={condition.tone} label={condition.label} /></span
    >
  {/if}
  <span
    class={cx(
      'gap-inline-sm text-body-sm text-fg-muted col-start-2 flex min-w-0 items-center sm:col-start-auto',
      device.connection === 'stale' && 'text-warning-fg font-medium',
    )}
  >
    {#if device.connection === 'current' && device.receivedAt}
      <Clock class="size-size-icon-sm shrink-0" aria-hidden="true" /><time
        datetime={device.receivedAt}
        title={fmtDateTime(device.receivedAt)}>{relativeLabel(device.receivedAt, now)} 수신</time
      >
    {:else if device.connection === 'stale' && device.receivedAt}
      <Clock class="size-size-icon-sm shrink-0" aria-hidden="true" /><span
        >마지막 수신 {fmtDateTime(device.receivedAt)}</span
      >
    {:else}
      <WifiOff class="size-size-icon-sm shrink-0" aria-hidden="true" /><span
        >{OWNER_CONNECTION[device.connection] === condition.label
          ? '수신 없음'
          : OWNER_CONNECTION[device.connection]}</span
      >
    {/if}
  </span>
  {#if columns}
    <span class="gap-inline-sm text-body-sm col-start-2 flex min-w-0 items-center sm:col-start-auto">
      {#if due}
        <Calendar class="size-size-icon-sm text-fg-muted shrink-0" aria-hidden="true" /><span
          class={cx('tabular-nums', dueSoon ? 'text-warning-fg font-medium' : 'text-fg-muted')}>{due.label}</span
        >
      {:else}
        <Badge variant="outline">{OWNER_DEPLOYMENT[device.deployment]}</Badge>
      {/if}
    </span>
  {/if}
  <span class="gap-inline-sm col-start-3 row-start-1 flex shrink-0 items-center sm:col-start-auto sm:row-start-auto">
    {#if actions}{@render actions()}{/if}
    {#if href}<ChevronRight class="text-fg-muted size-size-icon-md" aria-hidden="true" />{/if}
  </span>
</svelte:element>
