<script lang="ts">
  import { ownerHref, ownerSummary, type OwnerAlert, type OwnerApp, type OwnerDevice } from '@boomeyes/domain';
  import { ownerControl } from './core-helpers';
  let { devices, alerts, app, url }: { devices: OwnerDevice[]; alerts: OwnerAlert[]; app: OwnerApp; url: URL } =
    $props();
  const summary = $derived(ownerSummary(devices, alerts));
  const segments = $derived([
    { key: 'deployed', label: '현장 투입', count: summary.deployed, color: 'bg-fg' },
    { key: 'stored', label: '보관 중', count: summary.stored, color: 'bg-fg-muted' },
    { key: 'unknown', label: '배치 미확인', count: summary.unknown, color: 'bg-ui-active' },
  ]);
</script>

<section
  aria-label="장비 운영 구성"
  data-owner-summary
  data-total={summary.total}
  data-deployed={summary.deployed}
  data-stored={summary.stored}
  data-unknown={summary.unknown}
  class="gap-stack-lg rounded-card border-border bg-surface p-inset-xl flex flex-col border sm:flex-row sm:items-center"
>
  <a
    href={ownerHref(url, 'fleet', app)}
    class="{ownerControl()} gap-inline-md rounded-control sm:gap-stack-xs flex shrink-0 items-center sm:flex-col sm:items-start"
    aria-label="전체 장비 {summary.total}대 보기"
  >
    <span class="text-body-md text-fg-muted">전체 장비</span>
    <span class="text-display-lg tabular-nums">{summary.total}<span class="text-body-lg ml-inline-xs">대</span></span>
  </a>
  <div class="gap-stack-sm sm:pl-inset-xl flex min-w-0 flex-1 flex-col">
    <div class="gap-inline-xs h-size-indicator rounded-pill bg-surface-sunken flex overflow-hidden" aria-hidden="true">
      {#each segments.filter((segment) => segment.count > 0) as segment (segment.key)}
        <span class="{segment.color} rounded-pill" style:flex-grow={segment.count} style:flex-basis="0"></span>
      {/each}
    </div>
    <div class="gap-inline-md flex flex-wrap items-center justify-between">
      {#each segments.filter((segment) => segment.count > 0 || segment.key !== 'unknown') as segment (segment.key)}
        <a
          href={ownerHref(url, 'fleet', app, { filter: segment.key })}
          class="{ownerControl()} gap-inline-sm rounded-control text-body-md hover:text-accent-fg flex items-center"
        >
          <span class="text-fg-muted">{segment.label}</span>
          <strong class="text-heading-md tabular-nums"
            >{segment.count}<span class="text-body-md ml-inline-xs">대</span></strong
          >
        </a>
      {/each}
    </div>
  </div>
</section>
