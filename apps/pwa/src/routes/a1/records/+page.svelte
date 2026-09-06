<script lang="ts">
  // A1-06 기록 — 업무·점검·출근·서류 이력을 한 타임라인(시각 역순, append-only NFR-012) · 유형 칩 · 수정·삭제 없음 (specs/records-reports AC-1 · AC-2 · 장면 5)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type RecordKind } from '@boomeyes/domain';
  import { Chip, EmptyState, RECORD_KIND_LABEL, Timeline } from '@boomeyes/ui';
  let { data } = $props();
  const count = (k: RecordKind) => data.records.filter((r) => r.kind === k).length;
  const visible = $derived(data.kind === 'all' ? data.records : data.records.filter((r) => r.kind === data.kind));
  const items = $derived(
    visible.map((r) => ({
      at: r.at,
      by: r.actor,
      action: r.text,
      ...(r.note ? { note: r.note } : {}),
      tag: RECORD_KIND_LABEL[r.kind],
    })),
  );
  // 칩 전환은 다른 쿼리(?state= ?capture=)를 유지한다 — mock db 캐시 키가 바뀌면 안 된다(QA §3)
  const select = (k: string) => {
    const u = new URL(location.href);
    if (k === 'all') u.searchParams.delete('kind');
    else u.searchParams.set('kind', k);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A1-06']}>
  <p class="text-body-sm text-fg-muted" data-ref="FR-012">
    {data.sites[0]?.name ?? '내 현장'} · 최근 30일 · 이력은 추가만 됩니다
  </p>
  <div class="gap-inline-sm -mx-page-gutter px-page-gutter flex overflow-x-auto" role="group" aria-label="유형">
    <Chip class="shrink-0" selected={data.kind === 'all'} count={data.records.length} onclick={() => select('all')}
      >전체</Chip
    >
    {#each data.kinds as k (k)}
      <Chip class="shrink-0" selected={data.kind === k} count={count(k)} onclick={() => select(k)}
        >{RECORD_KIND_LABEL[k]}</Chip
      >
    {/each}
  </div>
  {#if items.length}
    <Timeline {items} newestFirst={false} label="기록" />
  {:else}
    <EmptyState
      title="기록이 없습니다"
      description="업무·점검·출근·서류 이력이 생기면 여기에 시각 역순으로 쌓입니다."
    />
  {/if}
</div>
