<script lang="ts">
  // B1-03 수신함 (specs/task-escalation AC-6) — 신청 목록 DataTable + 인스펙터(승인/반려) · 알림에서 온 업무(?case=) 패널
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Request } from '@boomeyes/domain';
  import {
    Button,
    DataTable,
    EVIDENCE_LABEL,
    EVIDENCE_TONE,
    EmptyState,
    REPORT_TYPE_LABEL,
    REQUEST_KIND_LABEL,
    REQUEST_STATE_LABEL,
    REQUEST_TONE,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    Timeline,
    fmtDateTime,
    fmtTime,
    toast,
    type Column,
    Inspector,
    PageHeader,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const COLUMNS: Column[] = [
    { key: 'kind', label: '유형', nowrap: true },
    { key: 'title', label: '내용' },
    { key: 'requester', label: '신청자', nowrap: true },
    { key: 'site', label: '현장', nowrap: true },
    { key: 'requestedAt', label: '요청 시각', kind: 'date' },
    { key: 'state', label: '상태', kind: 'status' },
  ];
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const userName = (id: string) => data.users.find((u) => u.id === id)?.display ?? id;
  // 선택: 사용자가 고른 행(picked)이 있으면 그것, 없으면 ?req= → 첫 대기 건. 승인 뒤에도 같은 행에 머문다(결과 확인)
  let picked = $state<string | null>(null);
  const selectedId = $derived(
    picked && data.requests.some((r) => r.id === picked)
      ? picked
      : (data.req ?? data.requests.find((r) => r.state === 'submitted' || r.state === 'review')?.id ?? null),
  );
  const selected = $derived(data.requests.find((r) => r.id === selectedId) ?? null);
  const pending = $derived(selected ? selected.state === 'submitted' || selected.state === 'review' : false);
  let note = $state('');
  let busy = $state(false);
  const me = () => session.user?.userId ?? 'control01';
  async function decide(kind: 'approve' | 'reject') {
    if (!selected) return;
    if (kind === 'reject' && !note.trim()) {
      toast('반려 사유를 입력하세요');
      return;
    }
    picked = selected.id;
    busy = true;
    try {
      if (kind === 'approve') await data.api.approveRequest(selected.id, me(), note || undefined);
      else await data.api.rejectRequest(selected.id, me(), note);
      toast(`${kind === 'approve' ? '승인' : '반려'} — ${selected.id}`);
      note = '';
      await invalidateAll();
    } finally {
      busy = false;
    }
  }
  async function accept() {
    if (!data.focus) return;
    await data.api.acceptCase(data.focus.id, me());
    toast(`접수 — ${data.focus.id}`);
    await invalidateAll();
  }
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B1-03']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="수신함"
      description="신청·요청 {data.requests.length}건 · 대기 {data.requests.filter(
        (r) => r.state === 'submitted' || r.state === 'review',
      ).length}건"
    />

    {#if data.focus}
      {@const c = data.focus}
      <section
        class="rounded-card border-accent-border bg-accent-bg-subtle p-inset-md gap-stack-xs flex flex-col border"
        aria-label="알림에서 열린 업무"
      >
        <div class="gap-inline-sm flex flex-wrap items-center">
          <span class="text-label-md text-fg-muted">알림에서 열린 업무 {c.id}</span>
          <StatusPill tone={TASK_TONE[c.state]} label={TASK_LABEL[c.state]} size="sm" />
          <StatusPill tone={SEVERITY_TONE[c.severity]} label={SEVERITY_LABEL[c.severity]} size="sm" />
          {#if data.focusEvent}<span data-evidence={data.focusEvent.evidence}
              ><StatusPill
                tone={EVIDENCE_TONE[data.focusEvent.evidence]}
                label="영상 {EVIDENCE_LABEL[data.focusEvent.evidence]}"
                size="sm"
              /></span
            >{/if}
        </div>
        <span class="text-heading-sm">{c.title}</span>
        {#if c.report}<span class="text-body-sm text-fg-muted" data-report-type={c.report.type}
            >{REPORT_TYPE_LABEL[c.report.type]}{c.report.cameraId ? ` · ${c.report.cameraId}` : ''}{c.report.videoAt
              ? ` · 영상 시점 ${fmtTime(c.report.videoAt)}`
              : ''}</span
          >{/if}
        <div class="gap-inline-sm flex flex-wrap">
          {#if c.state === 'new' || c.state === 'escalated'}<Button size="sm" onclick={accept}>접수</Button>{/if}
          {#if c.state === 'escalated'}<a
              href={resolve('/b1/escalation' as '/')}
              class="text-label-md text-accent-fg self-center">에스컬레이션 보기 →</a
            >{/if}
        </div>
      </section>
    {/if}

    {#if data.requests.length}
      <DataTable
        columns={COLUMNS}
        rows={data.requests}
        rowKey={(r: Request) => r.id}
        selectedKey={selectedId}
        onselect={(r: Request) => (picked = r.id)}
        dense
        caption="신청·요청 목록"
      >
        {#snippet cell(r: Request, col: Column)}
          {#if col.key === 'kind'}<span class="whitespace-nowrap">{REQUEST_KIND_LABEL[r.kind]}</span>
          {:else if col.key === 'title'}<span class="font-medium" title={r.title}>{r.title}</span>
          {:else if col.key === 'requester'}<span class="whitespace-nowrap">{userName(r.requesterId)}</span>
          {:else if col.key === 'site'}{siteName(r.siteId)}
          {:else if col.key === 'requestedAt'}<span class="tabular-nums">{fmtDateTime(r.requestedAt)}</span>
          {:else}<StatusPill tone={REQUEST_TONE[r.state]} label={REQUEST_STATE_LABEL[r.state]} size="sm" />{/if}
        {/snippet}
      </DataTable>
    {:else}
      <EmptyState title="신청·요청이 없습니다" />
    {/if}
  </div>

  {#snippet decideRow()}
    <Button variant="outline" tone="danger" disabled={busy} onclick={() => decide('reject')}>반려</Button>
    <Button disabled={busy} onclick={() => decide('approve')}>승인</Button>
  {/snippet}
  <Inspector label="신청 상세" footer={pending ? decideRow : undefined}>
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <div class="flex items-center justify-between">
          <span class="text-label-md text-fg-muted">{selected.id} · {REQUEST_KIND_LABEL[selected.kind]}</span>
          <StatusPill tone={REQUEST_TONE[selected.state]} label={REQUEST_STATE_LABEL[selected.state]} size="sm" />
        </div>
        <h2 class="text-heading-md">{selected.title}</h2>
        <p class="text-body-sm text-fg-muted">
          {userName(selected.requesterId)} · {siteName(selected.siteId)} · {fmtDateTime(selected.requestedAt)}
        </p>
        {#if selected.note}<p class="text-body-md bg-surface-sunken rounded-control p-inset-sm">{selected.note}</p>{/if}
      </div>
      {#if pending}
        <label class="gap-stack-xs flex flex-col">
          <span class="text-label-md text-fg-muted">메모 · 반려 사유</span>
          <textarea
            class="rounded-control border-border bg-surface p-inset-sm text-body-md min-h-size-control-lg w-full border"
            rows="3"
            bind:value={note}></textarea>
        </label>
      {/if}
      <Timeline items={selected.history} />
    {:else}
      <EmptyState title="신청을 선택하세요" />
    {/if}
  </Inspector>
</div>
