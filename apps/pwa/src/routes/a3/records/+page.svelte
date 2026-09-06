<script lang="ts">
  // A3-06 기록(본사) — 두 현장의 이력을 현장 칩으로 구분 · 유형 칩 · 열람 전용(처리 액션 없음, DISC-015) (specs/records-reports AC-3)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import { Chip, EmptyState, RECORD_KIND_LABEL, Timeline } from '@boomeyes/ui';
  let { data } = $props();
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const bySite = $derived(data.site === 'all' ? data.records : data.records.filter((r) => r.siteId === data.site));
  const visible = $derived(data.kind === 'all' ? bySite : bySite.filter((r) => r.kind === data.kind));
  const items = $derived(
    visible.map((r) => ({
      at: r.at,
      by: r.actor,
      action: r.text,
      ...(r.note ? { note: r.note } : {}),
      // 태그는 활성 필터 차원을 생략한다(현장을 골랐으면 현장명 없이 유형만)
      tag:
        [data.kind === 'all' ? RECORD_KIND_LABEL[r.kind] : '', data.site === 'all' ? siteName(r.siteId) : '']
          .filter(Boolean)
          .join(' · ') || undefined,
    })),
  );
  // 칩 전환은 다른 쿼리(?state= ?capture=)를 유지한다 — mock db 캐시 키가 바뀌면 안 된다(QA §3)
  const go = (site: string, kind: string) => {
    const u = new URL(location.href);
    if (site === 'all') u.searchParams.delete('site');
    else u.searchParams.set('site', site);
    if (kind === 'all') u.searchParams.delete('kind');
    else u.searchParams.set('kind', kind);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A3-06']}>
  <p class="text-body-sm text-fg-muted">자사 현장 {data.sites.length} · 최근 30일 · 열람 전용</p>
  <div class="gap-inline-sm -mx-page-gutter px-page-gutter flex overflow-x-auto" role="group" aria-label="현장">
    <Chip
      class="shrink-0"
      selected={data.site === 'all'}
      count={data.records.length}
      onclick={() => go('all', data.kind)}>전체</Chip
    >
    {#each data.sites as s (s.id)}
      <Chip
        class="shrink-0"
        selected={data.site === s.id}
        count={data.records.filter((r) => r.siteId === s.id).length}
        onclick={() => go(s.id, data.kind)}>{s.name}</Chip
      >
    {/each}
  </div>
  <div class="gap-inline-sm -mx-page-gutter px-page-gutter flex overflow-x-auto" role="group" aria-label="유형">
    <Chip class="shrink-0" selected={data.kind === 'all'} onclick={() => go(data.site, 'all')}>전체</Chip>
    {#each data.kinds as k (k)}
      <Chip
        class="shrink-0"
        selected={data.kind === k}
        count={bySite.filter((r) => r.kind === k).length}
        onclick={() => go(data.site, k)}>{RECORD_KIND_LABEL[k]}</Chip
      >
    {/each}
  </div>
  {#if items.length}
    <Timeline {items} newestFirst={false} label="기록" />
  {:else}
    <EmptyState title="기록이 없습니다" />
  {/if}
</div>
