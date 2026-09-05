<script lang="ts">
  // B4-07 부품 대장(W2 구조) — 부품군·품번·장착 위치·설치일·상태 pill(part 상태기계)·누적 타설(보조지표) · 인스펙터 이력(ENT-17) · 발주·재고 편집 비활성(FR-032 2단계) · 임계 배너 DISC-038 (specs/equipment-parts AC-1)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Part, type PartEvent, type Stock } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    DataTable,
    EmptyState,
    Inspector,
    KeyValueList,
    PART_EVENT_LABEL,
    PART_GROUP_LABEL,
    PART_STATE_LABEL,
    PART_TONE,
    PageHeader,
    ProgressBar,
    StatusPill,
    Timeline,
    type Column,
  } from '@boomeyes/ui';
  let { data } = $props();
  let picked = $state<string | null>(null);
  const selected = $derived(
    data.parts.find((p) => p.id === (picked ?? data.part)) ??
      data.parts.find((p) => p.state === 'due') ??
      data.parts[0] ??
      null,
  );
  const select = (id: string) => {
    picked = id;
    const u = new URL(location.href); // 다른 쿼리(?state= ?capture=) 유지 — mock db 캐시 키(QA §3)
    u.searchParams.set('part', id);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  const maxPoured = $derived(Math.max(1, ...data.parts.map((p) => p.pouredM3)));
  const unitOf = (deviceId: string) => {
    const d = data.devices.find((x) => x.id === deviceId);
    return d ? `${d.id} · ${d.unitNo}호기` : deviceId;
  };
  const eventText = (e: PartEvent) =>
    `${PART_EVENT_LABEL[e.kind]}${e.thicknessMm !== undefined ? ` · 실측 ${e.thicknessMm}mm` : ''}${e.pass !== undefined ? (e.pass ? ' · 합' : ' · 불') : ''}${e.reason ? ` · ${e.reason}` : ''}`;
  const timeline = $derived(
    data.events
      .filter((e) => e.partId === selected?.id)
      .map((e) => ({ at: e.at, by: e.worker ?? e.by, action: eventText(e), ...(e.note ? { note: e.note } : {}) })),
  );
  const COLS: Column[] = [
    { key: 'id', label: '부품' },
    { key: 'group', label: '부품군' },
    { key: 'partNo', label: '품번' },
    { key: 'position', label: '장착 위치' },
    { key: 'installedAt', label: '설치일' },
    { key: 'state', label: '상태' },
    { key: 'poured', label: '누적 타설(보조)' },
  ];
  const STOCK_COLS: Column[] = [
    { key: 'partNo', label: '품번' },
    { key: 'group', label: '부품군' },
    { key: 'onHand', label: '현재고', align: 'right' },
    { key: 'safety', label: '안전재고', align: 'right' },
    { key: 'status', label: '상태' },
  ];
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-07']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title="부품 대장"
      description="마모·교체 부품 5군(직관·이송배관 / 엘보·리듀서 / 플랜지·클램프 / 가스켓·안전핀 / 엔드호스·피팅) — 부품 ID 중심 · W2는 구조(자리+, DISC-044): 상태기계·이력·재고까지, 스캔·발주는 2단계"
    >
      {#snippet actions()}
        <a href={resolve('/b4/parts/history' as '/')} class="text-body-md text-accent-fg">점검·교체 이력 ›</a>
      {/snippet}
    </PageHeader>
    <div class="rounded-card bg-warning-bg text-warning-fg p-inset-md text-body-sm" role="note" data-banner="threshold">
      임계·점검 주기 — OEM 기준 미확정(DISC-038): 합불은 입력자 판정, 누적 타설량·운전시간은 보조지표(단독 폐기 기준
      아님)
    </div>
    <DataTable
      columns={COLS}
      rows={data.parts}
      rowKey={(p: Part) => p.id}
      selectedKey={selected?.id ?? null}
      onselect={(row: Part) => select(row.id)}
      caption="부품 대장 — CPB-003"
    >
      {#snippet cell(row: Part, col: Column)}
        {@const key = col.key}
        {#if key === 'id'}<span class="text-code-md">{row.id}</span>
        {:else if key === 'group'}{PART_GROUP_LABEL[row.group]}
        {:else if key === 'partNo'}<span class="text-code-md">{row.partNo}</span>
        {:else if key === 'position'}{unitOf(row.deviceId)} · {row.position}
        {:else if key === 'installedAt'}{row.installedAt.slice(0, 10)}
        {:else if key === 'state'}<StatusPill
            tone={PART_TONE[row.state]}
            label={PART_STATE_LABEL[row.state]}
            size="sm"
          />
        {:else if key === 'poured'}<ProgressBar
            value={(row.pouredM3 / maxPoured) * 100}
            label="타설"
            hint="{row.pouredM3} m³"
            tone="neutral"
          />
        {/if}
      {/snippet}
    </DataTable>
    <section class="gap-stack-sm flex flex-col" aria-label="재고">
      <div class="flex items-center justify-between">
        <h2 class="text-heading-md">재고 {data.stock.length}</h2>
        <div class="gap-inline-sm flex">
          <Button size="sm" variant="outline" tone="neutral" disabled title="발주는 FR-032 2단계">발주 — 2단계</Button>
          <Button size="sm" variant="outline" tone="neutral" disabled title="재고 편집은 FR-032 2단계"
            >재고 편집 — 2단계</Button
          >
        </div>
      </div>
      <DataTable columns={STOCK_COLS} rows={data.stock} rowKey={(s: Stock) => s.id} caption="재고 — 품번별" dense>
        {#snippet cell(row: Stock, col: Column)}
          {@const key = col.key}
          {#if key === 'partNo'}<span class="text-code-md">{row.partNo}</span>
          {:else if key === 'group'}{PART_GROUP_LABEL[row.group]}
          {:else if key === 'onHand'}{row.onHand}
          {:else if key === 'safety'}{row.safety}
          {:else if key === 'status'}<Badge tone={row.onHand <= row.safety ? 'warning' : 'success'}
              >{row.onHand <= row.safety ? '안전재고 이하' : '충분'}</Badge
            >
          {/if}
        {/snippet}
      </DataTable>
    </section>
  </div>
  <Inspector label="부품 상세">
    {#if selected}
      <div class="gap-stack-xs flex flex-col">
        <span class="text-label-md text-fg-muted">{selected.id} · {selected.partNo}</span>
        <span class="text-heading-sm">{PART_GROUP_LABEL[selected.group]}</span>
        <StatusPill tone={PART_TONE[selected.state]} label={PART_STATE_LABEL[selected.state]} size="sm" />
      </div>
      <KeyValueList
        items={[
          { label: '장착', value: `${unitOf(selected.deviceId)} · ${selected.position}` },
          { label: '설치일 · 로트', value: `${selected.installedAt.slice(0, 10)} · ${selected.lot}` },
          { label: '기준 두께', value: `${selected.baseThicknessMm} mm` },
          { label: '최근 실측', value: selected.lastThicknessMm === null ? '없음' : `${selected.lastThicknessMm} mm` },
          {
            label: '누적 타설 · 운전',
            value: `${selected.pouredM3} m³ · ${selected.runHours} h (보조지표)`,
            muted: true,
          },
        ]}
      />
      {#if timeline.length}
        <Timeline items={timeline} newestFirst={false} />
      {:else}
        <p class="text-body-sm text-fg-muted">이력 없음</p>
      {/if}
    {:else}
      <EmptyState title="부품을 선택하세요" />
    {/if}
  </Inspector>
</div>
