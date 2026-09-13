<script lang="ts">
  // 운영 상태 띠 — 지도 위에 떠 있는 한 줄(전체 → 보유 장비, 상태별 → 목록·알림 필터). KPI 카드가 아니라 칸막이 있는 띠.
  // 색은 숫자에만: 고장 danger · 점검·수신 지연 warning · 가동 중 success(ADR-014) · 보관 중립.
  import {
    ownerHref,
    ownerStrip,
    ownerSummary,
    type OwnerAlert,
    type OwnerApp,
    type OwnerDevice,
  } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import { ownerControl } from './core-helpers';
  let {
    devices,
    alerts,
    app,
    url,
    wrap = true,
    class: cls,
  }: {
    devices: OwnerDevice[];
    alerts: OwnerAlert[];
    app: OwnerApp;
    url: URL;
    /** false = 한 줄 가로 스크롤(PWA 지도 위 띠) */
    wrap?: boolean;
    class?: string;
  } = $props();
  const summary = $derived(ownerSummary(devices, alerts));
  const strip = $derived(ownerStrip(devices));
  const chips = $derived(
    [
      {
        key: 'running',
        label: '가동 중',
        count: strip.running,
        href: ownerHref(url, 'fleet', app, { filter: 'running' }),
        tone: 'text-success-fg',
      },
      {
        key: 'fault',
        label: '고장',
        count: strip.fault,
        href: ownerHref(url, 'alerts', app, { filter: 'fault' }),
        tone: 'text-danger-fg',
      },
      {
        key: 'inspection',
        label: '점검',
        count: strip.inspection,
        href: ownerHref(url, 'alerts', app, { filter: 'inspection' }),
        tone: 'text-warning-fg',
      },
      {
        key: 'stale',
        label: '수신 지연',
        count: strip.stale,
        href: ownerHref(url, 'alerts', app, { filter: 'connection' }),
        tone: 'text-warning-fg',
      },
      {
        key: 'stored',
        label: '보관',
        count: strip.stored,
        href: ownerHref(url, 'fleet', app, { filter: 'stored' }),
        tone: '',
      },
      {
        key: 'unknown',
        label: '배치 미확인',
        count: strip.unknown,
        href: ownerHref(url, 'fleet', app, { filter: 'unknown' }),
        tone: '',
      },
    ].filter((chip) => chip.count > 0 || chip.key === 'running'),
  );
  const item = 'gap-inline-xs px-inset-sm inline-flex items-center whitespace-nowrap';
</script>

<section
  aria-label="장비 운영 구성"
  data-owner-summary
  data-total={summary.total}
  data-deployed={summary.deployed}
  data-stored={summary.stored}
  data-unknown={summary.unknown}
  class={cx(
    'bg-surface shadow-raised border-border-subtle rounded-card px-inset-xs flex items-center border',
    wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto overscroll-x-contain',
    cls,
  )}
>
  <a
    href={ownerHref(url, 'fleet', app)}
    aria-label="전체 장비 {summary.total}대 보기"
    class={cx(ownerControl(), item, 'rounded-pill hover:bg-ui-hover')}
  >
    <strong class="text-heading-sm tabular-nums">{summary.total}</strong>
    <span class="text-label-md text-fg-muted">보유 장비</span>
  </a>
  {#each chips as chip (chip.key)}
    <a
      href={chip.href}
      class={cx(ownerControl(), item, 'border-border-subtle rounded-pill hover:bg-ui-hover border-l')}
      aria-label="{chip.label} {chip.count}대 보기"
    >
      <span class="text-label-md text-fg-muted">{chip.label}</span>
      <strong class={cx('text-label-md tabular-nums', chip.count > 0 && chip.tone)}>{chip.count}</strong>
    </a>
  {/each}
</section>
