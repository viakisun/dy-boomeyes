<script lang="ts">
  import { tick } from 'svelte';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import { ownerHref, ownerMatches, type OwnerDevice, type OwnerViewProps } from '@boomeyes/domain';
  import PageHeader from '../primitives/PageHeader.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import List from '../primitives/List.svelte';
  import { devicePoster } from './core-helpers';
  import { listReturn, ownerControl, ownerLink } from './core-helpers';
  let { data, app, url, navigate }: OwnerViewProps = $props();
  let query = $state('');
  let filter = $state('all');
  const filters = ['all', 'deployed', 'stored', 'unknown', 'attention'];
  const matches = $derived(data.devices.filter((device) => ownerMatches(device, query, filter)));
  $effect(() => {
    query = url.searchParams.get('q') ?? '';
    const requested = url.searchParams.get('filter') ?? 'all';
    filter = filters.includes(requested) ? requested : 'all';
  });
  $effect(() => {
    const scroll = Number(url.searchParams.get('scroll'));
    if (!Number.isFinite(scroll) || scroll <= 0) return;
    void tick().then(() => {
      const scroller = document.querySelector<HTMLElement>('[data-owner-scroll]');
      scroller?.scrollTo({ top: scroll });
      window.scrollTo({ top: scroll });
    });
  });
  function update(nextQuery: string, nextFilter: string) {
    query = nextQuery;
    filter = nextFilter;
    const target = new URL(url);
    if (nextQuery) target.searchParams.set('q', nextQuery);
    else target.searchParams.delete('q');
    if (nextFilter !== 'all') target.searchParams.set('filter', nextFilter);
    else target.searchParams.delete('filter');
    target.searchParams.delete('scroll');
    navigate(target.pathname + target.search);
  }
  function select(device: OwnerDevice) {
    navigate(ownerHref(url, 'detail', app, { return: listReturn(url) }, device.id));
  }
</script>

<div class="gap-stack-xl flex min-w-0 flex-col">
  <PageHeader title="보유 장비" />
  <section class="gap-stack-md flex flex-col" aria-label="장비 검색 및 목록">
    <div class="gap-inline-md grid min-w-0 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto]">
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
            value={query}
            placeholder="예: 1호기, CPB-001, 판교"
            class="{ownerControl()} text-body-md min-w-0 flex-1 bg-transparent"
            oninput={(event) => update(event.currentTarget.value, filter)}
          />
          {#if query}
            <button
              type="button"
              class="{ownerControl()} rounded-control min-w-size-touch-min inline-flex items-center justify-center"
              aria-label="검색어 지우기"
              onclick={() => update('', filter)}
            >
              <X class="size-size-icon-md" aria-hidden="true" />
            </button>
          {/if}
        </div>
      </div>
      <div class="gap-stack-xs flex min-w-0 flex-col">
        <label for="owner-fleet-filter" class="text-label-lg">배치 필터</label>
        <select
          id="owner-fleet-filter"
          value={filter}
          class="{ownerControl()} rounded-control border-border-strong bg-surface text-body-md px-inset-md border"
          onchange={(event) => update(query, event.currentTarget.value)}
        >
          <option value="all">전체 장비</option>
          <option value="deployed">현장 투입</option>
          <option value="stored">보관 중</option>
          <option value="unknown">배치 미확인</option>
          <option value="attention">확인 필요</option>
        </select>
      </div>
    </div>
    <div class="gap-inline-md flex flex-wrap items-center justify-between">
      <p role="status" class="text-body-md">
        전체 <strong>{data.devices.length}대</strong> 중 <strong>{matches.length}대</strong> 표시
      </p>
      {#if query || filter !== 'all'}
        <button type="button" class={ownerLink()} onclick={() => update('', 'all')}>검색·필터 초기화</button>
      {/if}
    </div>
    {#if data.devices.length === 0}
      <EmptyState
        title="등록된 장비가 없습니다"
        description="소유 장비가 등록되면 현장과 계약 정보를 함께 확인할 수 있습니다."
      />
    {:else if matches.length === 0}
      <EmptyState
        title="검색 결과가 없습니다"
        description="호기 번호와 현장 이름을 확인하거나 배치 필터를 변경해 주세요."
      >
        {#snippet action()}<button type="button" class={ownerLink()} onclick={() => update('', 'all')}
            >전체 장비 보기</button
          >{/snippet}
      </EmptyState>
    {:else}
      <List items={matches} key={(d) => d.id} label="보유 장비 목록">
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
  </section>
</div>
