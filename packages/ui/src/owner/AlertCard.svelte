<script lang="ts">
  // 알림 카드 — IconTile(종류 톤) · 제목(미확인 = semibold) · 호기·현장 메타 · 시각 + 미확인 배지 · 후행 화살표.
  // 루트는 href → <a>, onclick → <button aria-pressed>, 둘 다 없으면 <div>. rest로 data-alert·data-device를 루트에 싣는다(e2e).
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Truck from '@lucide/svelte/icons/truck';
  import Clock from '@lucide/svelte/icons/clock';
  import type { OwnerAlert, OwnerDevice } from '@boomeyes/domain';
  import { cx, OWNER_ALERT_TONE } from '../lib/cx';
  import { fmtDateTime, relativeLabel } from '../lib/format';
  import IconTile from '../primitives/IconTile.svelte';
  import Badge from '../primitives/Badge.svelte';
  import { OWNER_ALERT_ICON, ownerControl } from './core-helpers';
  let {
    alert,
    device,
    now,
    href,
    onclick,
    selected = false,
    class: cls,
    end,
    ...rest
  }: HTMLAttributes<HTMLElement> & {
    alert: OwnerAlert;
    device?: Pick<OwnerDevice, 'id' | 'unit' | 'site'>;
    /** DemoClock(data.at) — 상대 시각 계산 */
    now: string;
    href?: string;
    onclick?: () => void;
    selected?: boolean;
    class?: string;
    /** 후행 영역 대체(기본: 미확인 배지 + 화살표) */
    end?: Snippet;
  } = $props();
  const Icon = $derived(OWNER_ALERT_ICON[alert.kind]);
  const stale = $derived(alert.kind === 'connection');
</script>

<svelte:element
  this={href ? 'a' : onclick ? 'button' : 'div'}
  {href}
  type={onclick && !href ? 'button' : undefined}
  aria-pressed={onclick && !href ? selected : undefined}
  {onclick}
  class={cx(
    ownerControl(),
    'gap-inline-md px-inset-md py-inset-sm hover:bg-ui-hover flex w-full min-w-0 items-start text-left transition-colors',
    selected && 'bg-selected',
    cls,
  )}
  {...rest}
>
  <IconTile tone={OWNER_ALERT_TONE[alert.kind]}><Icon class="size-size-icon-lg" /></IconTile>
  <span class="gap-stack-xs flex min-w-0 flex-1 flex-col">
    <span class={cx('text-body-md break-words', alert.read ? 'text-fg-muted' : 'font-semibold')}>{alert.title}</span>
    {#if device}<span class="gap-inline-sm text-body-sm text-fg-muted flex min-w-0 items-center"
        ><Truck class="size-size-icon-sm shrink-0" aria-hidden="true" /><span class="truncate"
          >{device.unit}호기 · {device.site}</span
        ></span
      >{/if}
    <span class="gap-inline-sm text-body-sm text-fg-muted flex items-center"
      ><Clock class="size-size-icon-sm shrink-0" aria-hidden="true" /><time
        datetime={alert.at}
        title={fmtDateTime(alert.at)}
        class={cx(stale && 'text-warning-fg font-medium')}
        >{stale ? `마지막 수신 ${fmtDateTime(alert.at)}` : relativeLabel(alert.at, now)}</time
      ></span
    >
  </span>
  <span class="gap-stack-xs flex shrink-0 flex-col items-end">
    {#if end}{@render end()}{:else}
      {#if alert.read}<span class="text-label-sm text-fg-muted">읽음</span>{:else}<Badge variant="outline">미확인</Badge
        >{/if}
      {#if href}<ArrowRight class="size-size-icon-md text-fg-muted" aria-hidden="true" />{/if}
    {/if}
  </span>
</svelte:element>
