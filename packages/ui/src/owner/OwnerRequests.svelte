<script lang="ts">
  // 계약 — 현장 안전관리자가 보낸 투입 요청을 받아 호기를 배정한다(시안 «확정 2026-09-12» · FR-026).
  // 소유주의 판단은 「이 기간에 낼 수 있는 장비가 있나」 하나이고, 답은 보관 + 종료 임박이다.
  // 웹은 한 화면(좌 요청 / 우 후보), PWA는 두 단계(목록 → 요청 상세 + 후보) — 사용자 결정 2026-09-12.
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Phone from '@lucide/svelte/icons/phone';
  import {
    OWNER_REQUEST_LABEL,
    OWNER_REQUEST_STATES,
    ownerCandidates,
    ownerExpiryDays,
    ownerHref,
    type OwnerCandidate,
    type OwnerDevice,
    type OwnerRequest,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import type { Column } from '../lib/table';
  import { cx, TONE } from '../lib/cx';
  import { dueLabel, relativeLabel } from '../lib/format';
  import { toast } from '../primitives/toast-store.svelte';
  import PageHeader from '../primitives/PageHeader.svelte';
  import DataTable from '../primitives/DataTable.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import Button from '../primitives/Button.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import { OWNER_CONTRACT_TABS, ownerControl, ownerDate } from './core-helpers';
  let { data, api, app, url, navigate, refresh }: OwnerViewProps = $props();
  const web = $derived(app === 'web');
  const ORDER = Object.fromEntries(OWNER_REQUEST_STATES.map((s, i) => [s, i]));
  const requests = $derived([...data.requests].sort((a, b) => ORDER[a.state]! - ORDER[b.state]!));
  const open = $derived(requests.find((r) => r.id === url.searchParams.get('request')) ?? null);
  const candidates = $derived(open ? ownerCandidates(data.devices, open) : []);
  // 고른 호기는 확정 전까지 화면에만 있다 — 확정 한 번이 요청 상태와 계약 기간을 함께 바꾼다
  let picked = $state<string[]>([]);
  let busy = $state(false);
  let lastOpen = '';
  $effect(() => {
    if (open?.id === lastOpen) return;
    lastOpen = open?.id ?? '';
    picked = open ? [...open.assigned] : [];
  });
  const go = (request: OwnerRequest | null) => {
    const target = new URL(url);
    if (request) target.searchParams.set('request', request.id);
    else target.searchParams.delete('request');
    navigate(target.pathname + target.search, { history: request ? 'push' : 'replace' });
  };
  const toggle = (id: string) => {
    picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
  };
  async function confirm() {
    if (!open || busy) return;
    busy = true;
    try {
      const next = await api.assign(open.id, picked);
      await refresh();
      toast(`${next.siteName} ${picked.length}대 배정을 회신했습니다.`, { tone: 'success' });
    } catch (error) {
      toast(error instanceof Error ? error.message : '배정하지 못했습니다.', { tone: 'danger' });
    } finally {
      busy = false;
    }
  }
  const summary = $derived({
    fresh: requests.filter((r) => r.state === 'new').length,
    assigning: requests.filter((r) => r.state === 'assign').length,
    stored: data.devices.filter((d) => d.deployment === 'stored').length,
    ending: data.devices.filter((d) => {
      const days = ownerExpiryDays(d, data.at);
      return days !== null && days <= 90;
    }).length,
  });
  const REQUEST_COLUMNS: Column[] = [
    { key: 'id', label: '요청', kind: 'id' },
    { key: 'site', label: '현장' },
    { key: 'period', label: '기간', kind: 'date' },
    { key: 'count', label: '대수', kind: 'num' },
    { key: 'state', label: '상태', kind: 'status' },
    { key: 'received', label: '접수', kind: 'date' },
  ];
  const CANDIDATE_COLUMNS: Column[] = [
    { key: 'unit', label: '호기', kind: 'id' },
    { key: 'why', label: '가용 근거' },
    { key: 'received', label: '마지막 수신', kind: 'date' },
    { key: 'risk', label: '확인 사항', kind: 'status' },
    { key: 'pick', label: '배정', kind: 'status' },
  ];
  const STATE_TONE = { new: 'info', assign: 'accent', ship: 'progress', run: 'success', done: 'neutral' } as const;
  const why = (c: OwnerCandidate) =>
    c.reason === 'stored'
      ? { head: '보관 중', detail: c.device.site }
      : {
          head: `${dueLabel(c.freeAt!, new Date(data.at)).label} 종료`,
          detail: `${c.device.site} · ${ownerDate(c.freeAt!)}`,
        };
  /** 확인 사항 — 배정 전에 사람이 봐야 하는 것. 없으면 비운다. */
  function risk(device: OwnerDevice) {
    if (device.inspection) return '점검 필요';
    if (device.connection === 'detached') return '단말기 미장착';
    if (data.documents.filter((d) => d.deviceId === device.id).length < 4) return '서류 미비';
    return '';
  }
</script>

<div class="gap-stack-xl flex min-w-0 flex-col" data-owner-requests>
  {#if open}
    <!-- PWA 두 단계의 둘째 화면(웹도 같은 주소를 쓴다) -->
    <div class="gap-stack-md flex min-w-0 flex-col">
      <div>
        <button
          type="button"
          class="{ownerControl()} gap-inline-xs text-accent-fg inline-flex items-center"
          onclick={() => go(null)}
        >
          <ArrowLeft class="size-size-icon-sm" aria-hidden="true" />요청 목록
        </button>
      </div>
      <div class={cx('gap-stack-lg flex min-w-0 flex-col', web && 'lg:flex-row lg:items-start')}>
        <aside
          class={cx(
            'bg-surface rounded-card shadow-raised border-border-subtle p-inset-lg gap-stack-md flex min-w-0 flex-col border',
            web && 'lg:w-layout-inspector-width lg:shrink-0',
          )}
          aria-label="요청 상세"
        >
          <div class="gap-stack-xs flex flex-col">
            <p class="text-code-sm text-fg-muted">{open.id} · {relativeLabel(open.receivedAt, data.at)} 접수</p>
            <h2 class="text-heading-lg">{open.siteName}</h2>
            <p class="text-body-md text-fg-muted">{open.region} · {open.builder}</p>
          </div>
          <dl class="gap-stack-xs gap-x-inline-md text-body-md grid grid-cols-[auto_1fr]">
            <dt class="text-fg-muted">요청 기간</dt>
            <dd>{ownerDate(open.from)} – {ownerDate(open.to)}</dd>
            <dt class="text-fg-muted">필요 대수</dt>
            <dd>{open.count}대</dd>
            <dt class="text-fg-muted">사양</dt>
            <dd>{open.spec}</dd>
            <dt class="text-fg-muted">안전관리자</dt>
            <dd class="gap-inline-xs flex flex-wrap items-center">
              {open.manager.name}
              <a
                href="tel:{open.manager.phone}"
                class="{ownerControl()} text-accent-fg gap-inline-xs inline-flex items-center"
              >
                <Phone class="size-size-icon-sm" aria-hidden="true" />{open.manager.phone}
              </a>
            </dd>
          </dl>
          <div class="gap-stack-sm border-border-subtle pt-stack-sm flex flex-col border-t">
            <h3 class="text-label-lg gap-inline-xs flex items-center justify-between">
              배정<span class="text-fg-muted tabular-nums" data-assign-count>{picked.length} / {open.count}대</span>
            </h3>
            {#if picked.length === 0}
              <p class="text-body-sm text-fg-muted">아래 후보에서 호기를 고르세요.</p>
            {:else}
              <ul class="gap-inline-xs flex list-none flex-wrap p-0">
                {#each picked as id (id)}
                  <li>
                    <button
                      type="button"
                      class="{ownerControl()} gap-inline-xs rounded-pill bg-accent-bg text-accent-fg px-inset-sm text-label-md inline-flex items-center"
                      onclick={() => toggle(id)}
                    >
                      {data.devices.find((d) => d.id === id)?.unit}호기<span aria-hidden="true">×</span>
                      <span class="sr-only">배정에서 빼기</span>
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
            <Button
              onclick={confirm}
              loading={busy}
              disabled={picked.length !== open.count || open.state === 'run' || open.state === 'done'}
              >배정 확정 · 회신</Button
            >
            <p class="text-body-sm text-fg-muted">
              확정하면 그 호기의 계약 기간이 채워지고 보유 장비·운영 현황에 반영됩니다.
            </p>
          </div>
        </aside>
        <section class="gap-stack-sm flex min-w-0 flex-1 flex-col" aria-label="후보 호기">
          <p class="text-body-md" role="status">
            <strong>{candidates.length}대</strong> 후보 · 요청 시작 {ownerDate(open.from)} 기준 (보관
            {candidates.filter((c) => c.reason === 'stored').length} · 종료 임박
            {candidates.filter((c) => c.reason === 'expiring').length})
          </p>
          {#if candidates.length === 0}
            <EmptyState
              title="이 기간에 낼 수 있는 호기가 없습니다"
              description="요청 기간에 보관 중이거나 계약이 끝나는 장비가 없습니다. 기간이나 사양을 현장과 다시 맞춰 주세요."
            />
          {:else if web}
            <DataTable
              columns={CANDIDATE_COLUMNS}
              rows={candidates}
              rowKey={(c) => c.device.id}
              rowAttrs={(c) => ({ 'data-candidate': c.device.id })}
              isSelected={(c) => picked.includes(c.device.id)}
              stickyHead
              caption="후보 호기"
              class="max-h-layout-table-scroll overflow-y-auto"
            >
              {#snippet cell(c: OwnerCandidate, column: Column)}
                {#if column.key === 'unit'}
                  {c.device.unit}호기
                {:else if column.key === 'why'}
                  {@const reason = why(c)}
                  <span class="gap-stack-xs flex flex-col">
                    <strong class={c.reason === 'stored' ? 'text-success-fg' : undefined}>{reason.head}</strong>
                    <span class="text-body-sm text-fg-muted">{reason.detail}</span>
                  </span>
                {:else if column.key === 'received'}
                  {c.device.receivedAt ? relativeLabel(c.device.receivedAt, data.at) : '수신 없음'}
                {:else if column.key === 'risk'}
                  {@const label = risk(c.device)}
                  {#if label}<span class="rounded-pill px-inset-xs text-label-sm {TONE.warning.subtle}">{label}</span
                    >{/if}
                {:else}
                  {@render pick(c)}
                {/if}
              {/snippet}
            </DataTable>
          {:else}
            <ul class="gap-stack-sm flex list-none flex-col p-0">
              {#each candidates as c (c.device.id)}
                {@const reason = why(c)}
                <li
                  data-candidate={c.device.id}
                  class="bg-surface rounded-card border-border-subtle p-inset-md gap-stack-xs flex flex-col border"
                >
                  <div class="gap-inline-sm flex items-center justify-between">
                    <span class="text-heading-sm">{c.device.unit}호기</span>
                    {@render pick(c)}
                  </div>
                  <p class="text-body-md">
                    <strong class={c.reason === 'stored' ? 'text-success-fg' : undefined}>{reason.head}</strong>
                    <span class="text-fg-muted">· {reason.detail}</span>
                  </p>
                  {#if risk(c.device)}
                    <p>
                      <span class="rounded-pill px-inset-xs text-label-sm {TONE.warning.subtle}">{risk(c.device)}</span>
                    </p>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      </div>
    </div>
  {:else}
    <PageHeader title="계약" description="현장 안전관리자가 보낸 CPB 투입 요청을 받아 호기를 배정합니다" />
    <nav aria-label="계약·운전자" class="gap-inline-sm flex flex-wrap">
      {#each OWNER_CONTRACT_TABS as tab (tab.view)}
        <a
          href={ownerHref(url, tab.view, app)}
          aria-current={tab.view === 'requests' ? 'page' : undefined}
          class={cx(
            ownerControl(),
            'rounded-pill px-inset-md text-label-md inline-flex items-center',
            tab.view === 'requests' ? 'bg-accent text-accent-on-solid' : 'bg-surface-sunken text-fg-muted',
          )}>{tab.label}</a
        >
      {/each}
    </nav>
    <p class="text-body-md" role="status">
      새 요청 <strong>{summary.fresh}건</strong> · 배정 중 <strong>{summary.assigning}건</strong> · 보관 가용
      <strong>{summary.stored}대</strong> · 90일 내 종료 <strong>{summary.ending}대</strong>
    </p>
    {#if requests.length === 0}
      <EmptyState title="대기 중인 요청이 없습니다" description="현장에서 투입 요청이 오면 이곳에 쌓입니다." />
    {:else if web}
      <DataTable
        columns={REQUEST_COLUMNS}
        rows={requests}
        rowKey={(r) => r.id}
        rowAttrs={(r) => ({ 'data-request': r.id })}
        onselect={go}
        caption="투입 요청 — 행을 누르면 배정 화면이 열린다"
      >
        {#snippet cell(request: OwnerRequest, column: Column)}
          {#if column.key === 'id'}
            {request.id}
          {:else if column.key === 'site'}
            <span class="gap-stack-xs flex flex-col">
              {request.siteName}
              <!-- 둘째 줄에 지역이 먼저다(시안) — 어디로 보내는 일인지가 누가 맡는지보다 먼저 읽힌다 -->
              <span class="text-body-sm text-fg-muted"
                >{request.region} · {request.builder} · {request.manager.name}</span
              >
            </span>
          {:else if column.key === 'period'}
            {ownerDate(request.from)} – {ownerDate(request.to)}
          {:else if column.key === 'count'}
            {request.count}대
          {:else if column.key === 'state'}
            <StatusPill size="sm" tone={STATE_TONE[request.state]} label={OWNER_REQUEST_LABEL[request.state]} />
          {:else}
            {relativeLabel(request.receivedAt, data.at)}
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <ul class="gap-stack-sm flex list-none flex-col p-0">
        {#each requests as request (request.id)}
          <li>
            <button
              type="button"
              data-request={request.id}
              onclick={() => go(request)}
              class="{ownerControl()} bg-surface rounded-card border-border-subtle p-inset-md gap-stack-xs flex w-full flex-col border text-left"
            >
              <span class="gap-inline-sm flex items-center justify-between">
                <span class="text-heading-sm">{request.siteName}</span>
                <StatusPill size="sm" tone={STATE_TONE[request.state]} label={OWNER_REQUEST_LABEL[request.state]} />
              </span>
              <span class="text-body-sm text-fg-muted"
                >{request.region} · {request.builder} · {request.manager.name}</span
              >
              <span class="text-body-md"
                >{ownerDate(request.from)} – {ownerDate(request.to)} · <strong>{request.count}대</strong></span
              >
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

{#snippet pick(c: OwnerCandidate)}
  {@const on = picked.includes(c.device.id)}
  <Button
    size="sm"
    variant={on ? 'solid' : 'outline'}
    tone={on ? 'accent' : 'neutral'}
    onclick={() => toggle(c.device.id)}
    aria-pressed={on}
    ><!-- 소유주 셸이 button의 줄바꿈을 허용해서 좁은 칸에서 두 줄이 된다 -->
    <span class="whitespace-nowrap">{on ? '배정됨' : '배정'}</span></Button
  >
{/snippet}
