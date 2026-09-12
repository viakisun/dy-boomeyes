<script lang="ts">
  // 운영 구성 — 큰 숫자(보유) · 분포 막대(role=img) · 범례 링크(카운트). 보관을 가용으로 표시하지 않는다.
  import { ownerHref, ownerSummary, type OwnerAlert, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
  import { ownerControl } from './core-helpers';
  let {
    devices,
    alerts,
    app,
    url,
    interactive = true,
    variant = 'card',
    class: cls,
  }: {
    devices: OwnerDevice[];
    alerts: OwnerAlert[];
    app: OwnerApp;
    url: URL;
    interactive?: boolean;
    /** card = 카드 한 줄 · inline = 헤더 옆 한 줄(테두리·그림자 없음) */
    variant?: 'card' | 'inline';
    class?: string;
  } = $props();
  const summary = $derived(ownerSummary(devices, alerts));
  const segments = $derived([
    { key: 'deployed', label: '현장 투입', count: summary.deployed, color: 'bg-fg' },
    { key: 'stored', label: '보관 중', count: summary.stored, color: 'bg-fg-subtle' },
    { key: 'unknown', label: '배치 미확인', count: summary.unknown, color: 'bg-ui-active' },
  ]);
  const legend = $derived(segments.filter((s) => s.count > 0 || s.key !== 'unknown'));
  const sites = $derived(new Set(devices.map((d) => d.site).filter(Boolean)).size);
</script>

<section
  aria-label="장비 운영 구성"
  data-owner-summary
  data-total={summary.total}
  data-deployed={summary.deployed}
  data-stored={summary.stored}
  data-unknown={summary.unknown}
  class="gap-inline-lg flex min-w-0 flex-col sm:flex-row sm:items-center {variant === 'card'
    ? 'rounded-card bg-surface shadow-raised px-inset-lg py-inset-md'
    : ''} {cls ?? ''}"
>
  <svelte:element
    this={interactive ? 'a' : 'div'}
    href={interactive ? ownerHref(url, 'fleet', app) : undefined}
    class="{ownerControl()} gap-inline-lg rounded-control flex shrink-0 items-center"
    aria-label={interactive ? `전체 장비 ${summary.total}대 보기` : undefined}
  >
    <span class="text-display-lg leading-none tabular-nums">{summary.total}</span>
    <span class="gap-stack-xs flex flex-col">
      <span class="text-label-md text-fg-muted">보유 장비</span>
      <span class="text-body-sm text-fg-muted">{sites}개 현장</span>
    </span>
  </svelte:element>
  <div class="gap-stack-xs flex min-w-0 flex-1 flex-col {variant === 'card' ? 'sm:pl-inset-lg' : ''}">
    <div
      class="gap-inline-xs h-size-indicator rounded-pill bg-surface-sunken flex overflow-hidden"
      role="img"
      aria-label={legend.map((s) => `${s.label} ${s.count}대`).join(', ')}
    >
      {#each segments.filter((segment) => segment.count > 0) as segment (segment.key)}
        <span class="{segment.color} rounded-pill" style:flex-grow={segment.count} style:flex-basis="0"></span>
      {/each}
    </div>
    <div class="gap-inline-lg flex flex-wrap items-center">
      {#each legend as segment (segment.key)}
        <svelte:element
          this={interactive ? 'a' : 'span'}
          href={interactive ? ownerHref(url, 'fleet', app, { filter: segment.key }) : undefined}
          class="gap-inline-sm rounded-control text-label-md hover:text-accent-fg min-h-size-touch-min inline-flex items-center"
        >
          <span class="{segment.color} rounded-mark size-size-indicator inline-block" aria-hidden="true"></span>
          <span class="text-fg-muted">{segment.label}</span>
          <strong class="tabular-nums">{segment.count}</strong>
        </svelte:element>
      {/each}
      {#if summary.attention > 0}
        <svelte:element
          this={interactive ? 'a' : 'span'}
          href={interactive ? ownerHref(url, 'fleet', app, { filter: 'attention' }) : undefined}
          class="gap-inline-sm rounded-control text-label-md hover:text-accent-fg min-h-size-touch-min ml-auto inline-flex items-center"
        >
          <span class="text-fg-muted">확인 필요</span><strong class="tabular-nums">{summary.attention}</strong>
        </svelte:element>
      {/if}
    </div>
  </div>
</section>
