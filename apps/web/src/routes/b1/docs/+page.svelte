<script lang="ts">
  // B1-05 서류 현황 — 대상별 완비율 · 만료 임박(D-30) 목록 · 인스펙터(이력 · 요청 회신 링크) · 운영사는 모니터링만(entities.rules) (specs/documents AC-4)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Doc } from '@boomeyes/domain';
  import {
    Badge,
    DOC_KIND_LABEL,
    DOC_STATE_LABEL,
    DOC_TONE,
    DataTable,
    EmptyState,
    Inspector,
    Stat,
    StatusPill,
    Timeline,
    dueLabel,
    fmtDateTime,
    type Column,
  } from '@boomeyes/ui';
  let { data } = $props();
  const now = $derived(data.clock.now());
  const sorted = $derived([...data.docs].sort((a, b) => ((a.expiresAt ?? '9') < (b.expiresAt ?? '9') ? -1 : 1)));
  const expiring = $derived(data.docs.filter((d) => d.state === 'expiring' || d.state === 'rejected'));
  let picked = $state<string | null>(null);
  const selectedId = $derived(
    picked && data.docs.some((d) => d.id === picked) ? picked : (data.doc ?? expiring[0]?.id ?? sorted[0]?.id ?? null),
  );
  const selected = $derived(data.docs.find((d) => d.id === selectedId) ?? null);
  const request = $derived(
    selected ? data.requests.find((r) => r.kind === 'doc' && r.note?.includes(selected.id)) : undefined,
  );
  const COLS: Column[] = [
    { key: 'id', label: '서류' },
    { key: 'kind', label: '유형' },
    { key: 'subject', label: '대상' },
    { key: 'site', label: '현장' },
    { key: 'state', label: '상태' },
    { key: 'expires', label: '만료' },
  ];
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const rate = $derived(
    data.completeness.length
      ? Math.round(data.completeness.reduce((a, c) => a + c.rate, 0) / data.completeness.length)
      : 0,
  );
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B1-05']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <header class="gap-stack-xs flex flex-col">
      <h1 class="text-heading-xl">서류 현황</h1>
      <p class="text-body-sm text-fg-muted">등록·승인은 현장 · 운영사는 완비율 모니터링과 요청 회신 · 만료 D-30 알림</p>
    </header>
    <div class="gap-inline-md grid grid-cols-2 md:grid-cols-4" aria-label="완비율 요약">
      <Stat
        label="평균 완비율"
        value={rate}
        unit="%"
        tone={rate === 100 ? 'success' : 'warning'}
        hint="대상 {data.completeness.length}"
      />
      <Stat
        label="만료 임박·반려"
        value={expiring.length}
        unit="건"
        tone={expiring.length ? 'danger' : 'success'}
        hint="D-30 이내 · 반려"
      />
      <Stat
        label="검토 중"
        value={data.docs.filter((d) => d.state === 'review' || d.state === 'submitted').length}
        unit="건"
        tone="info"
        hint="현장 승인 대기"
      />
      <Stat label="전체" value={data.docs.length} unit="건" tone="neutral" hint="5유형" />
    </div>
    <section class="gap-stack-sm flex flex-col" aria-label="대상별 완비율">
      <h2 class="text-heading-md">완비율 — 현장 · 장비 · 운전자</h2>
      <ul class="gap-inline-sm flex flex-wrap" aria-label="대상별 완비율">
        {#each data.completeness as c (c.subjectId)}
          <li data-kind={c.kind}>
            <Badge
              tone={c.rate === 100 ? 'success' : c.expiring ? 'danger' : 'warning'}
              variant={c.kind === 'site' ? 'solid' : 'subtle'}
              >{c.kind === 'site' ? '현장 ' : ''}{c.subject} {c.rate}% ({c.complete}/{c.total})</Badge
            >
          </li>
        {/each}
      </ul>
    </section>
    <DataTable
      columns={COLS}
      rows={sorted}
      rowKey={(d: Doc) => d.id}
      selectedKey={selectedId}
      onselect={(row: Doc) => (
        (picked = row.id),
        goto(resolve(`/b1/docs?doc=${row.id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true })
      )}
      caption="서류 목록 — 만료 빠른 순"
    >
      {#snippet cell(row: Doc, col: Column)}
        {@const key = col.key}
        {#if key === 'id'}<span class="text-code-md">{row.id}</span>
        {:else if key === 'kind'}{DOC_KIND_LABEL[row.kind]}
        {:else if key === 'subject'}{row.subject}
        {:else if key === 'site'}<span class="text-body-sm text-fg-muted">{siteName(row.siteId)}</span>
        {:else if key === 'state'}<StatusPill tone={DOC_TONE[row.state]} label={DOC_STATE_LABEL[row.state]} size="sm" />
        {:else if key === 'expires'}
          {#if row.expiresAt}{@const d = dueLabel(row.expiresAt, now)}<span
              class={d.overdue ? 'text-danger-fg font-semibold' : ''}>{d.label}</span
            >{:else}—{/if}
        {/if}
      {/snippet}
    </DataTable>
  </div>
  <Inspector label="서류 상세">
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <span class="text-label-md text-fg-muted">{selected.id} · {DOC_KIND_LABEL[selected.kind]}</span>
        <span class="text-heading-sm">{selected.subject}</span>
        <span class="text-body-sm text-fg-muted">현장 {siteName(selected.siteId)}</span>
        <div class="gap-inline-sm flex flex-wrap items-center">
          <StatusPill tone={DOC_TONE[selected.state]} label={DOC_STATE_LABEL[selected.state]} size="sm" />
          {#if selected.expiresAt}<span class="text-body-sm text-fg-muted">만료 {fmtDateTime(selected.expiresAt)}</span
            >{/if}
        </div>
      </div>
      {#if request}
        <a href={resolve(`/b1/inbox?req=${request.id}` as '/')} class="text-body-sm text-accent-fg"
          >요청 회신 — {request.id} ({request.state})</a
        >
      {:else}
        <span class="text-body-sm text-fg-muted">연결된 요청 없음 — 등록·승인은 현장 앱에서</span>
      {/if}
      <Timeline items={selected.history} />
    {:else}
      <EmptyState title="서류를 선택하세요" />
    {/if}
  </Inspector>
</div>
