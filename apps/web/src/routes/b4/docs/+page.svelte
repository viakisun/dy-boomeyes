<script lang="ts">
  // B4-06 서류 관리 — 등록 폼(유형 5 · 대상 · 유효기간) → valid / D-30 이내면 expiring · 목록 (specs/documents AC-5)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Doc, type DocKind } from '@boomeyes/domain';
  import {
    Button,
    DOC_KIND_LABEL,
    DOC_STATE_LABEL,
    DOC_TONE,
    DataTable,
    EmptyState,
    Inspector,
    StatusPill,
    Tabs,
    TextField,
    Timeline,
    dueLabel,
    toast,
    type Column,
    PageHeader,
    Select,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const now = $derived(data.clock.now());
  const KINDS = Object.keys(DOC_KIND_LABEL) as DocKind[];
  let kind = $state<DocKind>('cert');
  let subjectId = $state('');
  let subject = $state('');
  let expiresAt = $state('');
  let busy = $state(false);
  let picked = $state<string | null>(null);
  const selected = $derived(data.docs.find((d) => d.id === picked) ?? data.docs[0] ?? null);
  // 대상 = 현장 · 장비 · 운전자/안전관리자 (AC-5)
  const subjects = $derived([
    ...data.sites.map((s) => ({ id: s.id, label: `현장 · ${s.name} (${s.id})` })),
    ...data.devices.map((d) => ({ id: d.id, label: `${d.id} · ${d.unitNo}호기` })),
    ...data.users
      .filter((u) => u.role === 'driver' || u.role === 'site-safety')
      .map((u) => ({ id: u.id, label: `${u.display} (${u.id})` })),
  ]);
  const tabs = [
    { id: 'list', label: '목록' },
    { id: 'register', label: '등록' },
  ];
  const select = (id: string) =>
    goto(resolve(`/b4/docs?tab=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  async function register() {
    if (!subjectId || !subject.trim()) {
      toast('대상과 서류명을 입력하세요');
      return;
    }
    busy = true;
    try {
      const d = await data.api.registerDoc(
        { kind, subject: subject.trim(), subjectId, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null },
        session.user?.userId ?? 'ops01',
      );
      await invalidateAll();
      toast(`등록 — ${d.id} ${DOC_STATE_LABEL[d.state]}`);
      picked = d.id;
      subject = '';
      expiresAt = '';
      select('list');
    } catch (e) {
      toast(`등록 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
  const COLS: Column[] = [
    { key: 'id', label: '서류', kind: 'id' },
    { key: 'kind', label: '유형', nowrap: true },
    { key: 'subject', label: '대상' },
    { key: 'state', label: '상태', kind: 'status' },
    { key: 'expires', label: '만료', kind: 'date' },
  ];
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-06']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader title="서류 관리" description="서류 5유형 등록·검토 · 만료 30일 전부터 만료 임박" ref="DISC-016">
      <Tabs {tabs} value={data.tab} onchange={select} />
    </PageHeader>
    {#if data.tab === 'register'}
      <form
        class="gap-stack-md rounded-card border-border bg-surface p-inset-lg max-w-layout-form-max flex flex-col border"
        aria-label="서류 등록"
        onsubmit={(e) => (e.preventDefault(), register())}
      >
        <Select
          label="유형"
          value={kind}
          options={KINDS.map((k) => ({ value: k, label: DOC_KIND_LABEL[k] }))}
          onchange={(e) => (kind = e.currentTarget.value as DocKind)}
        />
        <Select
          label="대상"
          bind:value={subjectId}
          options={subjects.map((s) => ({ value: s.id, label: s.label }))}
          placeholder="선택"
          required
        />
        <TextField label="서류명" bind:value={subject} placeholder="예: CPB-001 제작증" required />
        <TextField label="유효기간(만료일)" type="date" bind:value={expiresAt} />
        <div class="flex justify-end"><Button type="submit" disabled={busy}>등록</Button></div>
      </form>
    {:else if data.docs.length}
      <DataTable
        columns={COLS}
        rows={data.docs}
        rowKey={(d: Doc) => d.id}
        selectedKey={selected?.id ?? null}
        onselect={(row: Doc) => (picked = row.id)}
        caption="서류 목록"
      >
        {#snippet cell(row: Doc, col: Column)}
          {@const key = col.key}
          {#if key === 'id'}{row.id}
          {:else if key === 'kind'}{DOC_KIND_LABEL[row.kind]}
          {:else if key === 'subject'}<span title={row.subject}>{row.subject}</span>
          {:else if key === 'state'}<StatusPill
              tone={DOC_TONE[row.state]}
              label={DOC_STATE_LABEL[row.state]}
              size="sm"
            />
          {:else if key === 'expires'}{row.expiresAt ? dueLabel(row.expiresAt, now).label : '—'}
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <EmptyState title="등록된 서류가 없습니다" />
    {/if}
  </div>
  <Inspector label="서류 상세">
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <span class="text-label-md text-fg-muted">{selected.id} · {DOC_KIND_LABEL[selected.kind]}</span>
        <span class="text-heading-sm">{selected.subject}</span>
        <StatusPill tone={DOC_TONE[selected.state]} label={DOC_STATE_LABEL[selected.state]} size="sm" />
      </div>
      <Timeline items={selected.history} />
    {:else}
      <EmptyState title="서류를 선택하세요" />
    {/if}
  </Inspector>
</div>
