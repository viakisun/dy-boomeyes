<script lang="ts">
  // B1-06 임대 계약 — 만료 빠른 순(LS-001 D-27 최상단) · 인스펙터 계약 상세 + 재배치 계획(expiring → relocated, 대상 현장·메모 → 이력) · 안전관리자 홍보 연계(원본 니즈: 추가 일거리) (specs/sites-assets-leases AC-3 · 장면 9 · DISC-037)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Lease } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    DataTable,
    EmptyState,
    Inspector,
    KeyValueList,
    LEASE_STATE_LABEL,
    LEASE_TONE,
    PageHeader,
    Select,
    Stat,
    StatusPill,
    TextField,
    Timeline,
    dueLabel,
    toast,
    type Column,
    StatGroup,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const now = $derived(data.clock.now());
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const unitOf = (id: string) => {
    const d = data.devices.find((x) => x.id === id);
    return d ? `${d.id} · ${d.unitNo}호기` : id;
  };
  const safetyOf = (siteId: string) => {
    const s = data.sites.find((x) => x.id === siteId);
    return data.users.find((u) => u.id === s?.safetyUserId)?.display ?? s?.safetyUserId ?? '—';
  };
  // 만료 빠른 순 — 만료 임박이 최상단
  const sorted = $derived([...data.leases].sort((a, b) => (a.to < b.to ? -1 : 1)));
  const count = (st: Lease['state']) => data.leases.filter((l) => l.state === st).length;
  let picked = $state<string | null>(null);
  const selected = $derived(data.leases.find((l) => l.id === (picked ?? data.lease)) ?? sorted[0] ?? null);
  const select = (id: string) => {
    picked = id;
    goto(resolve(`/b1/leases?lease=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  let toSiteId = $state('');
  let note = $state('');
  let busy = $state(false);
  const targets = $derived(
    selected
      ? data.sites.filter((s) => s.id !== selected.siteId).map((s) => ({ value: s.id, label: `${s.name} (${s.id})` }))
      : [],
  );
  async function plan() {
    if (!selected || !toSiteId) return;
    busy = true;
    try {
      await data.api.planRelocation(selected.id, toSiteId, note.trim(), session.user?.userId ?? 'control01');
      await invalidateAll();
      toast(`재배치 계획 — ${selected.id} → ${siteName(toSiteId)}`);
      toSiteId = '';
      note = '';
    } catch (e) {
      toast(`재배치 계획 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
  const COLS: Column[] = [
    { key: 'id', label: '계약', kind: 'id' },
    { key: 'device', label: '호기', nowrap: true },
    { key: 'site', label: '현장', nowrap: true },
    { key: 'owner', label: '임대인', nowrap: true },
    { key: 'period', label: '기간', kind: 'date' },
    { key: 'due', label: '잔여', kind: 'status' },
    { key: 'state', label: '상태', kind: 'status' },
  ];
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B1-06']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="임대 계약"
      description="만료 임박 계약이 위에 옵니다 · 재배치 계획은 상세에서"
      ref="EXT-4 DISC-037"
    />
    <StatGroup label="계약 요약">
      <Stat
        label="만료 임박"
        value={count('expiring')}
        unit="건"
        tone={count('expiring') ? 'warning' : 'neutral'}
        hint="D-30 이내"
      />
      <Stat label="재배치 계획" value={count('relocated')} unit="건" hint="대상 현장 확정" />
      <Stat label="계약 중" value={count('active')} unit="건" />
      <Stat
        label="전체"
        value={data.leases.length}
        unit="건"
        tone="neutral"
        hint="임대인 {new Set(data.leases.map((l) => l.ownerId)).size}"
      />
    </StatGroup>
    {#if sorted.length}
      <DataTable
        columns={COLS}
        rows={sorted}
        rowKey={(l: Lease) => l.id}
        selectedKey={selected?.id ?? null}
        onselect={(row: Lease) => select(row.id)}
        caption="임대 계약 — 만료 빠른 순"
      >
        {#snippet cell(row: Lease, col: Column)}
          {@const key = col.key}
          {#if key === 'id'}{row.id}
          {:else if key === 'device'}{unitOf(row.deviceId)}
          {:else if key === 'site'}{siteName(row.siteId)}{#if row.toSiteId}<span class="text-label-sm text-fg-muted">
                → {siteName(row.toSiteId)}</span
              >{/if}
          {:else if key === 'owner'}{row.ownerId}
          {:else if key === 'period'}<span class="whitespace-nowrap"
              >{row.from.slice(0, 10)} ~ {row.to.slice(0, 10)}</span
            >
          {:else if key === 'due'}{@const d = dueLabel(row.to, now)}<span
              class={d.overdue ? 'text-danger-fg font-semibold' : ''}>{d.label}</span
            >
          {:else if key === 'state'}<StatusPill
              tone={LEASE_TONE[row.state]}
              label={LEASE_STATE_LABEL[row.state]}
              size="sm"
            />
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <EmptyState title="임대 계약이 없습니다" />
    {/if}
  </div>
  <Inspector label="계약 상세">
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <span class="text-label-md text-fg-muted">{selected.id} · {selected.ownerId}</span>
        <span class="text-heading-sm">{unitOf(selected.deviceId)}</span>
        <div class="gap-inline-sm flex flex-wrap items-center">
          <StatusPill tone={LEASE_TONE[selected.state]} label={LEASE_STATE_LABEL[selected.state]} size="sm" />
          <span class="text-body-sm text-fg-muted"
            >만료 {selected.to.slice(0, 10)} · {dueLabel(selected.to, now).label}</span
          >
        </div>
      </div>
      <KeyValueList
        items={[
          { label: '현장', value: siteName(selected.siteId) },
          { label: '현장 안전관리자', value: safetyOf(selected.siteId) },
          ...(selected.toSiteId ? [{ label: '재배치 대상', value: siteName(selected.toSiteId) }] : []),
          ...(selected.note ? [{ label: '메모', value: selected.note }] : []),
        ]}
      />
      {#if selected.state === 'expiring'}
        <form
          class="gap-stack-sm flex flex-col"
          aria-label="재배치 계획"
          onsubmit={(e) => (e.preventDefault(), plan())}
        >
          <Select label="재배치 대상 현장" bind:value={toSiteId} options={targets} placeholder="현장 선택" required />
          <TextField label="메모" bind:value={note} placeholder="예: 10월 타설 시작 현장으로 이동" />
          <div class="flex justify-end"><Button type="submit" disabled={busy || !toSiteId}>재배치 계획</Button></div>
        </form>
      {:else if selected.state === 'relocated'}
        <Badge tone="info">재배치 계획 확정 — {siteName(selected.toSiteId ?? '')}</Badge>
      {/if}
      <p class="text-body-sm text-fg-muted">
        홍보 연계: 현장 안전관리자 {safetyOf(selected.siteId)}에게 관제 기술(영상·AI·에스컬레이션) 소개 → 후속 현장 임대
        제안(원본 니즈: 추가 일거리 확보)
      </p>
      <Timeline items={selected.history} />
    {:else}
      <EmptyState title="계약을 선택하세요" />
    {/if}
  </Inspector>
</div>
