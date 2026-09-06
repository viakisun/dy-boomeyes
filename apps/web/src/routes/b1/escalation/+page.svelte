<script lang="ts">
  // B1-04 에스컬레이션 (specs/task-escalation AC-7) — 임계 1h 미접수 → 건설사 본사 + 관제 통보
  import { invalidateAll } from '$app/navigation';
  import { SCR, type Escalation } from '@boomeyes/domain';
  import {
    Banner,
    Button,
    DataTable,
    EmptyState,
    EscalationTimer,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    Timeline,
    fmtDateTime,
    toast,
    type Column,
    Inspector,
    PageHeader,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const COLUMNS: Column[] = [
    { key: 'case', label: '업무', nowrap: true },
    { key: 'site', label: '현장', nowrap: true },
    { key: 'elapsed', label: '경과', kind: 'status' },
    { key: 'notify', label: '통보 대상', nowrap: true },
    { key: 'notifiedAt', label: '통보 시각', kind: 'date' },
  ];
  const ROLE_LABEL: Record<string, string> = { 'hq-safety': '건설사 본사', control: '관제' };
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  let selectedId = $derived<string | null>(data.escalations[0]?.case.id ?? null);
  const selected = $derived(data.escalations.find((e) => e.case.id === selectedId) ?? null);
  async function accept() {
    if (!selected) return;
    await data.api.acceptCase(selected.case.id, session.user?.userId ?? 'control01');
    toast(`접수 — ${selected.case.id}`);
    await invalidateAll();
  }
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B1-04']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="에스컬레이션"
      description="미접수 임계 초과 {data.escalations.length}건 · 기준 시각 {fmtDateTime(data.clock.iso())}"
    />
    <Banner tone="warning"
      >중대 업무가 1시간(협의) 동안 접수되지 않으면 건설사 본사 안전관리자와 관제에 자동 통보됩니다.</Banner
    >
    {#if data.escalations.length}
      <DataTable
        columns={COLUMNS}
        rows={data.escalations}
        rowKey={(e: Escalation) => e.case.id}
        selectedKey={selectedId}
        onselect={(e: Escalation) => (selectedId = e.case.id)}
        dense
        caption="에스컬레이션 목록"
      >
        {#snippet cell(e: Escalation, col: Column)}
          {#if col.key === 'case'}
            <span class="gap-inline-sm flex items-center">
              <span class="text-code-md whitespace-nowrap">{e.case.id}</span>
              <span class="font-medium">{e.case.title}</span>
              <StatusPill tone={SEVERITY_TONE[e.case.severity]} label={SEVERITY_LABEL[e.case.severity]} size="sm" />
            </span>
          {:else if col.key === 'site'}{siteName(e.case.siteId)}
          {:else if col.key === 'elapsed'}<EscalationTimer elapsedMs={e.elapsedMs} />
          {:else if col.key === 'notify'}{e.notifyTo.map((r) => ROLE_LABEL[r] ?? r).join(' · ')}
          {:else}<span class="tabular-nums">{fmtDateTime(e.notifiedAt)}</span>{/if}
        {/snippet}
      </DataTable>
    {:else}
      <EmptyState title="에스컬레이션된 업무가 없습니다" description="모든 중대 업무가 임계 안에 접수되었습니다." />
    {/if}
  </div>

  {#snippet acceptRow()}
    <Button onclick={accept}>관제에서 접수</Button>
  {/snippet}
  <Inspector label="업무 상세" footer={selected ? acceptRow : undefined}>
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <div class="flex items-center justify-between">
          <span class="text-label-md text-fg-muted">{selected.case.id}</span>
          <StatusPill tone={TASK_TONE[selected.case.state]} label={TASK_LABEL[selected.case.state]} size="sm" />
        </div>
        <h2 class="text-heading-md">{selected.case.title}</h2>
        <p class="text-body-sm text-fg-muted">
          {siteName(selected.case.siteId)} · 발행 {fmtDateTime(selected.case.createdAt)}
        </p>
        <EscalationTimer elapsedMs={selected.elapsedMs} />
      </div>
      <Timeline items={selected.case.history} />
    {:else}
      <EmptyState title="업무를 선택하세요" />
    {/if}
  </Inspector>
</div>
