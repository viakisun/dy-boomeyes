<script lang="ts">
  // B4-08 점검·교체 이력(W2 구조) — 점검(실측·외관·체결·합불)·교체·폐기 행을 시각 역순 · 구분 칩 · 누적 타설량·운전시간은 보조지표로만 (specs/equipment-parts AC-4)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type PartEvent } from '@boomeyes/domain';
  import {
    Chip,
    DataTable,
    EmptyState,
    Inspector,
    KeyValueList,
    PART_EVENT_LABEL,
    PART_GROUP_LABEL,
    PageHeader,
    StatusPill,
    fmtDateTime,
    type Column,
  } from '@boomeyes/ui';
  let { data } = $props();
  const visible = $derived(data.kind === 'all' ? data.events : data.events.filter((e) => e.kind === data.kind));
  let picked = $state<string | null>(null);
  const selected = $derived(visible.find((e) => e.id === (picked ?? data.event)) ?? visible[0] ?? null);
  const partOf = (id: string) => data.parts.find((p) => p.id === id);
  const go = (kind: string) => {
    const u = new URL(location.href); // 다른 쿼리(?state= ?capture=) 유지(QA §3)
    if (kind === 'all') u.searchParams.delete('kind');
    else u.searchParams.set('kind', kind);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  const VISUAL = { ok: '양호', wear: '마모', crack: '균열' } as const;
  const FASTEN = { ok: '양호', loose: '풀림' } as const;
  const COLS: Column[] = [
    { key: 'at', label: '시각' },
    { key: 'part', label: '부품' },
    { key: 'kind', label: '구분' },
    { key: 'thickness', label: '실측(mm)', align: 'right' },
    { key: 'visual', label: '외관' },
    { key: 'fastening', label: '체결' },
    { key: 'pass', label: '합불' },
    { key: 'by', label: '작업자' },
    { key: 'reason', label: '사유' },
  ];
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-08']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader title="점검·교체 이력" description="점검 · 교체 · 폐기 이력 — 추가만 됩니다" ref="ENT-17">
      <div class="gap-inline-sm flex flex-wrap" role="group" aria-label="구분">
        <Chip selected={data.kind === 'all'} count={data.events.length} onclick={() => go('all')}>전체</Chip>
        {#each data.kinds as k (k)}
          <Chip selected={data.kind === k} count={data.events.filter((e) => e.kind === k).length} onclick={() => go(k)}
            >{PART_EVENT_LABEL[k]}</Chip
          >
        {/each}
      </div>
    </PageHeader>
    {#if visible.length}
      <DataTable
        columns={COLS}
        rows={visible}
        rowKey={(e: PartEvent) => e.id}
        selectedKey={selected?.id ?? null}
        onselect={(row: PartEvent) => (picked = row.id)}
        caption="점검·교체 이력 — 시각 역순"
        dense
      >
        {#snippet cell(row: PartEvent, col: Column)}
          {@const key = col.key}
          {#if key === 'at'}<span class="whitespace-nowrap tabular-nums">{fmtDateTime(row.at)}</span>
          {:else if key === 'part'}<span class="text-code-md whitespace-nowrap">{row.partId}</span>
          {:else if key === 'kind'}<StatusPill
              tone={row.kind === 'inspect'
                ? 'info'
                : row.kind === 'replace'
                  ? 'progress'
                  : row.kind === 'discard'
                    ? 'neutral'
                    : 'success'}
              label={PART_EVENT_LABEL[row.kind]}
              size="sm"
            />
          {:else if key === 'thickness'}{row.thicknessMm ?? '—'}
          {:else if key === 'visual'}<span class="whitespace-nowrap">{row.visual ? VISUAL[row.visual] : '—'}</span>
          {:else if key === 'fastening'}<span class="whitespace-nowrap"
              >{row.fastening ? FASTEN[row.fastening] : '—'}</span
            >
          {:else if key === 'pass'}{#if row.pass === undefined}—{:else}<span
                class={row.pass ? 'text-success-fg' : 'text-danger-fg font-semibold'}>{row.pass ? '합' : '불'}</span
              >{/if}
          {:else if key === 'by'}{row.worker ?? row.by}
          {:else if key === 'reason'}{row.reason ?? row.note ?? '—'}
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <EmptyState title="이력이 없습니다" />
    {/if}
  </div>
  <Inspector label="이력 상세">
    {#if selected}
      <span class="text-label-md text-fg-muted">{selected.id} · {PART_EVENT_LABEL[selected.kind]}</span>
      <span class="text-heading-sm"
        >{selected.partId} · {PART_GROUP_LABEL[partOf(selected.partId)?.group ?? 'pipe']}</span
      >
      <KeyValueList
        items={[
          { label: '시각', value: fmtDateTime(selected.at) },
          { label: '작업자', value: selected.worker ?? selected.by },
          ...(selected.thicknessMm !== undefined
            ? [
                {
                  label: '실측 두께',
                  value: `${selected.thicknessMm} mm (기준 ${partOf(selected.partId)?.baseThicknessMm ?? '—'} mm)`,
                },
              ]
            : []),
          ...(selected.visual
            ? [
                {
                  label: '외관 · 체결',
                  value: `${VISUAL[selected.visual]} · ${selected.fastening ? FASTEN[selected.fastening] : '—'}`,
                },
              ]
            : []),
          ...(selected.pass !== undefined
            ? [
                {
                  label: 'OEM 합불',
                  value: selected.pass ? '합 (입력자 판정)' : '불 → 교체 대상',
                },
              ]
            : []),
          ...(selected.reason ? [{ label: '사유', value: selected.reason }] : []),
          ...(selected.photo ? [{ label: '증빙 사진', value: selected.photo.name }] : []),
          ...(selected.note ? [{ label: '메모', value: selected.note }] : []),
          {
            label: '보조지표',
            value: `누적 타설 ${partOf(selected.partId)?.pouredM3 ?? '—'} m³ · 운전 ${partOf(selected.partId)?.runHours ?? '—'} h`,
            muted: true,
          },
        ]}
      />
    {:else}
      <EmptyState title="이력을 선택하세요" />
    {/if}
  </Inspector>
</div>
