<script lang="ts">
  // 보유 장비 — 시안은 표 하나다(카드·썸네일 없음). 검색 1 · 필터 3축 · 현장별 묶어 보기 ·
  // 「120대 중 N대」 · 행 클릭 = 호기(«확정 2026-09-12»).
  // 웹은 DataTable(머리글 정렬·머리 고정), PWA는 카드 리스트를 유지한다(사용자 결정 2026-09-12) —
  // 같은 상태·같은 URL을 쓰고 형태만 다르다.
  import { tick } from 'svelte';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import {
    OWNER_FLEET_DEFAULT,
    OWNER_FLEET_EXPIRY,
    OWNER_FLEET_SORTS,
    OWNER_FLEET_STATES,
    OWNER_FLEET_STATE_LABEL,
    ownerExpiryDays,
    ownerFleetRows,
    ownerFleetState,
    ownerHref,
    type OwnerDevice,
    type OwnerFleetQuery,
    type OwnerFleetSort,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import type { Column } from '../lib/table';
  import { dueLabel, fmtDateTime, relativeLabel } from '../lib/format';
  import { TONE } from '../lib/cx';
  import PageHeader from '../primitives/PageHeader.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import DataTable from '../primitives/DataTable.svelte';
  import Select from '../primitives/Select.svelte';
  import Switch from '../primitives/Switch.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import List from '../primitives/List.svelte';
  import { devicePoster, listReturn, ownerControl, ownerLink } from './core-helpers';
  let { data, app, url, navigate }: OwnerViewProps = $props();
  const web = $derived(app === 'web');
  // URL이 상태의 원천이다 — 표와 카드가 같은 주소를 공유하고 뒤로가기가 필터를 되돌린다
  const query = $derived.by((): OwnerFleetQuery => {
    const get = (key: string) => url.searchParams.get(key) ?? '';
    const sort = OWNER_FLEET_SORTS.find((s) => s === get('sort')) ?? OWNER_FLEET_DEFAULT.sort;
    const expiry = OWNER_FLEET_EXPIRY.find((e) => e === get('expiry')) ?? OWNER_FLEET_DEFAULT.expiry;
    return {
      q: get('q'),
      filter: get('filter') || 'all',
      site: get('site') || 'all',
      expiry,
      sort,
      dir: get('dir') === 'desc' ? 'desc' : 'asc',
    };
  });
  const rows = $derived(ownerFleetRows(data.devices, query, data.at));
  const grouped = $derived(url.searchParams.get('group') === '1');
  // 현장별 묶음 — 현장마다 묶음 하나(정렬은 묶음 안에서 그대로 산다).
  // 행이 현장 순서로 오지 않으므로 이어 붙이면 같은 현장이 여러 묶음이 된다.
  const groups = $derived.by(() => {
    if (!grouped) return null;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- $derived 안의 계산용 · 반응 대상이 아니다
    const byId = new Map<string, { id: string; name: string; rows: OwnerDevice[] }>();
    for (const device of rows) {
      const group = byId.get(device.siteId) ?? { id: device.siteId, name: device.site, rows: [] };
      group.rows.push(device);
      byId.set(device.siteId, group);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  });
  const sites = $derived(
    [...new Map(data.devices.map((d) => [d.siteId, d.site]))].sort((a, b) => a[1].localeCompare(b[1], 'ko')),
  );
  // 이 소유주에게 실제로 있는 상태만 고른다 — 0건 선택지는 고르는 사람을 헷갈리게 한다
  const states = $derived(new Set(data.devices.map(ownerFleetState)));
  const dirty = $derived(
    query.q !== '' || query.filter !== 'all' || query.site !== 'all' || query.expiry !== 'all' || grouped,
  );
  $effect(() => {
    const scroll = Number(url.searchParams.get('scroll'));
    if (!Number.isFinite(scroll) || scroll <= 0) return;
    void tick().then(() => {
      const scroller = document.querySelector<HTMLElement>('[data-owner-scroll]');
      scroller?.scrollTo({ top: scroll });
      window.scrollTo({ top: scroll });
    });
  });
  function update(patch: Record<string, string>) {
    const target = new URL(url);
    for (const [key, value] of Object.entries(patch)) {
      if (value) target.searchParams.set(key, value);
      else target.searchParams.delete(key);
    }
    target.searchParams.delete('scroll');
    navigate(target.pathname + target.search);
  }
  const reset = () => update({ q: '', filter: '', site: '', expiry: '', group: '', sort: '', dir: '' });
  // 같은 열을 다시 누르면 방향만 뒤집는다
  const sortBy = (key: string) =>
    update({ sort: key, dir: query.sort === key && query.dir === 'asc' ? 'desc' : 'asc' });
  function select(device: OwnerDevice) {
    navigate(ownerHref(url, 'detail', app, { return: listReturn(url) }, device.id));
  }
  const ALL_COLUMNS: Column[] = [
    { key: 'unit', label: '호기', kind: 'num', sortable: true },
    { key: 'site', label: '현장', sortable: true },
    { key: 'state', label: '상태', kind: 'status' },
    { key: 'received', label: '마지막 수신', kind: 'date', sortable: true },
    { key: 'expiry', label: '계약 종료', kind: 'date', sortable: true },
    { key: 'attention', label: '주의', kind: 'status' },
    { key: 'company', label: '건설사', nowrap: true },
  ];
  // 묶어 보면 현장 이름이 제목에 있다 — 같은 값을 한 번 더 세로로 반복하지 않는다
  const columns = $derived(grouped ? ALL_COLUMNS.filter((c) => c.key !== 'site') : ALL_COLUMNS);
  const STATE_TONE = {
    fault: 'danger',
    inspection: 'warning',
    stale: 'warning',
    unintegrated: 'neutral',
    running: 'success',
    unknown: 'neutral',
    stored: 'neutral',
  } as const;
  /** 주의 칩 — 지금 손이 가야 하는 이유만. 이유가 없으면 칸을 비운다(빈 칸이 「없음」이다). */
  function attention(device: OwnerDevice) {
    const chips: { key: string; label: string; tone: 'danger' | 'warning' }[] = [];
    if (device.fault) chips.push({ key: 'fault', label: device.fault, tone: 'danger' });
    if (device.inspection) chips.push({ key: 'inspection', label: device.inspection, tone: 'warning' });
    if (device.connection === 'stale') chips.push({ key: 'stale', label: '수신 지연', tone: 'warning' });
    const days = ownerExpiryDays(device, data.at);
    if (days !== null && days <= 30)
      chips.push({ key: 'expiry', label: days < 0 ? '계약 종료됨' : `계약 D-${days}`, tone: 'warning' });
    return chips;
  }
</script>

<div class="gap-stack-xl flex min-w-0 flex-col">
  <PageHeader title="보유 장비" />
  <section class="gap-stack-md flex flex-col" aria-label="장비 검색 및 목록">
    <div class="gap-stack-xs flex min-w-0 flex-col">
      <label for="owner-fleet-query" class="text-label-lg">호기·현장 검색</label>
      <div
        class="gap-inline-sm rounded-control border-border-strong bg-surface px-inset-md flex min-w-0 items-center border"
      >
        <Search class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
        <input
          id="owner-fleet-query"
          type="search"
          autocomplete="off"
          value={query.q}
          placeholder="예: 1호기, CPB-001, 판교, 한빛건설"
          class="{ownerControl()} text-body-md min-w-0 flex-1 bg-transparent"
          oninput={(event) => update({ q: event.currentTarget.value })}
        />
        {#if query.q}
          <button
            type="button"
            class="{ownerControl()} rounded-control min-w-size-touch-min inline-flex items-center justify-center"
            aria-label="검색어 지우기"
            onclick={() => update({ q: '' })}
          >
            <X class="size-size-icon-md" aria-hidden="true" />
          </button>
        {/if}
      </div>
    </div>
    <!-- 필터는 세 축뿐이다(시안) — 상태 · 현장 · 계약 종료. 축이 늘면 아무도 쓰지 않는다. -->
    <div class="gap-inline-md flex flex-wrap items-end">
      <Select
        label="상태"
        value={query.filter}
        options={[
          { value: 'all', label: '전체 상태' },
          // 확인 필요·현장 투입은 상태 여럿을 묶은 것이다 — 띠와 구성 막대의 링크가 이 값으로 온다
          { value: 'attention', label: '확인 필요' },
          { value: 'deployed', label: '현장 투입' },
          ...OWNER_FLEET_STATES.filter((s) => states.has(s)).map((s) => ({
            value: s,
            label: OWNER_FLEET_STATE_LABEL[s],
          })),
        ]}
        onchange={(event) => update({ filter: event.currentTarget.value === 'all' ? '' : event.currentTarget.value })}
      />
      <Select
        label="현장"
        value={query.site}
        options={[{ value: 'all', label: '전체 현장' }, ...sites.map(([id, name]) => ({ value: id, label: name }))]}
        onchange={(event) => update({ site: event.currentTarget.value === 'all' ? '' : event.currentTarget.value })}
      />
      <Select
        label="계약 종료"
        value={query.expiry}
        options={[
          { value: 'all', label: '전체 기간' },
          { value: '30', label: '30일 이내' },
          { value: '60', label: '60일 이내' },
          { value: '90', label: '90일 이내' },
        ]}
        onchange={(event) => update({ expiry: event.currentTarget.value === 'all' ? '' : event.currentTarget.value })}
      />
      {#if !web}
        <Select
          label="정렬"
          value={query.sort}
          options={[
            { value: 'attention', label: '확인 필요 우선' },
            { value: 'unit', label: '호기 번호' },
            { value: 'site', label: '현장' },
            { value: 'received', label: '마지막 수신' },
            { value: 'expiry', label: '계약 종료' },
          ]}
          onchange={(event) => update({ sort: event.currentTarget.value as OwnerFleetSort, dir: '' })}
        />
      {/if}
      <Switch label="현장별 묶어 보기" checked={grouped} onchange={(next) => update({ group: next ? '1' : '' })} />
    </div>
    <div class="gap-inline-md flex flex-wrap items-center justify-between">
      <p role="status" class="text-body-md">
        전체 <strong>{data.devices.length}대</strong> 중 <strong>{rows.length}대</strong> 표시
      </p>
      {#if dirty}
        <button type="button" class={ownerLink()} onclick={reset}>검색·필터 초기화</button>
      {/if}
    </div>
    {#if data.devices.length === 0}
      <EmptyState
        title="등록된 장비가 없습니다"
        description="소유 장비가 등록되면 현장과 계약 정보를 함께 확인할 수 있습니다."
      />
    {:else if rows.length === 0}
      <EmptyState
        title="검색 결과가 없습니다"
        description="호기 번호와 현장 이름을 확인하거나 상태·현장·계약 종료 필터를 바꿔 주세요."
      >
        {#snippet action()}<button type="button" class={ownerLink()} onclick={reset}>전체 장비 보기</button>{/snippet}
      </EmptyState>
    {:else}
      {#each groups ?? [{ id: 'all', name: '', rows }] as group (group.id)}
        {#if group.name}
          <h2 class="text-heading-sm pt-stack-sm" data-fleet-group={group.id}>
            {group.name}
            <span class="text-fg-muted text-body-md">{group.rows.length}대</span>
          </h2>
        {/if}
        {#if web}
          {@render table(group.rows, group.name || '보유 장비')}
        {:else}
          <List items={group.rows} key={(d) => d.id} label={group.name ? `${group.name} 장비` : '보유 장비 목록'}>
            {#snippet item(device)}
              <EquipmentRow
                {device}
                now={data.at}
                layout="columns"
                poster={devicePoster(data.cameras, device.id)}
                href={ownerHref(url, 'detail', app, { return: url.pathname + url.search }, device.id)}
                onselect={select}
              />
            {/snippet}
          </List>
        {/if}
      {/each}
    {/if}
  </section>
</div>

{#snippet table(items: OwnerDevice[], caption: string)}
  <DataTable
    {columns}
    rows={items}
    rowKey={(d) => d.id}
    rowAttrs={(d) => ({ 'data-device': d.id })}
    onselect={select}
    sort={{ key: query.sort, dir: query.dir }}
    onsort={sortBy}
    stickyHead
    caption="{caption} — 행을 누르면 호기 화면이 열린다"
    class="max-h-layout-table-scroll overflow-y-auto"
  >
    {#snippet cell(device: OwnerDevice, column: Column)}
      {#if column.key === 'unit'}
        {device.unit}
      {:else if column.key === 'site'}
        {device.site}
      {:else if column.key === 'state'}
        {@const state = ownerFleetState(device)}
        <span class="gap-inline-xs inline-flex items-center">
          <span class="size-size-indicator rounded-full {TONE[STATE_TONE[state]].dot}" aria-hidden="true"></span>
          {OWNER_FLEET_STATE_LABEL[state]}
        </span>
      {:else if column.key === 'received'}
        {#if device.receivedAt}
          <span title={fmtDateTime(device.receivedAt)}>{relativeLabel(device.receivedAt, data.at)}</span>
        {:else}
          <span class="text-fg-muted">수신 없음</span>
        {/if}
      {:else if column.key === 'expiry'}
        {#if device.contract}
          <span title={device.contract.to}>{dueLabel(device.contract.to, new Date(data.at)).label}</span>
        {:else}
          <span class="text-fg-muted">—</span>
        {/if}
      {:else if column.key === 'attention'}
        <span class="gap-inline-xs inline-flex flex-wrap items-center">
          {#each attention(device) as chip (chip.key)}
            <span class="rounded-pill px-inset-xs text-label-sm {TONE[chip.tone].subtle}">{chip.label}</span>
          {/each}
        </span>
      {:else}
        {device.contract?.company ?? '—'}
      {/if}
    {/snippet}
  </DataTable>
{/snippet}
