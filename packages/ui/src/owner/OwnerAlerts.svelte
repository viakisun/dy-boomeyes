<script lang="ts">
  // 이상·점검 — Chip 필터(카운트) · 알림 목록(AlertCard button data-alert) · 선택 알림 상세(IconTile + StatusPill + KeyValueList + ContactCard + 읽음).
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Bell from '@lucide/svelte/icons/bell';
  import { ownerHref, ownerSummary, type OwnerAlert, type OwnerViewProps } from '@boomeyes/domain';
  import { OWNER_ALERT_TONE } from '../lib/cx';
  import { OWNER_ALERT_KIND_LABEL } from '../lib/labels';
  import { fmtDateTime } from '../lib/format';
  import Button from '../primitives/Button.svelte';
  import Chip from '../primitives/Chip.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import PageHeader from '../primitives/PageHeader.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import KeyValueList from '../primitives/KeyValueList.svelte';
  import ContactCard from '../primitives/ContactCard.svelte';
  import List from '../primitives/List.svelte';
  import AlertCard from './AlertCard.svelte';
  import { OWNER_ALERT_ICON } from './core-helpers';
  let { data, api, app, url, navigate, refresh }: OwnerViewProps = $props();
  const summary = $derived(ownerSummary(data.devices, data.alerts));
  const filter = $derived(url.searchParams.get('filter') ?? 'all');
  const scoped = $derived(
    data.alerts.filter((a) => !url.searchParams.get('device') || a.deviceId === url.searchParams.get('device')),
  );
  const shown = $derived(scoped.filter((a) => filter === 'all' || filter === a.kind));
  const selected = $derived(shown.find((a) => a.id === url.searchParams.get('alert')));
  const device = $derived(selected && data.devices.find((d) => d.id === selected.deviceId));
  const kinds = $derived([
    { value: 'all', label: '전체', count: scoped.length },
    ...(['fault', 'inspection', 'connection'] as const).map((k) => ({
      value: k,
      label: OWNER_ALERT_KIND_LABEL[k],
      count: scoped.filter((a) => a.kind === k).length,
    })),
  ]);
  let error = $state('');
  let busy = $state(false);
  function select(id: string | null) {
    const next = new URL(url);
    if (id) next.searchParams.set('alert', id);
    else next.searchParams.delete('alert');
    navigate(next.pathname + next.search);
  }
  function setFilter(value: string) {
    const next = new URL(url);
    next.searchParams.set('filter', value);
    next.searchParams.delete('alert');
    navigate(next.pathname + next.search);
  }
  async function read() {
    if (!selected) return;
    busy = true;
    error = '';
    try {
      await api.markRead(selected.id);
      await refresh();
    } catch (e) {
      error = e instanceof Error ? e.message : '처리하지 못했습니다.';
    } finally {
      busy = false;
    }
  }
  const SelectedIcon = $derived(selected ? OWNER_ALERT_ICON[selected.kind] : null);
  const kindOf = (a: OwnerAlert) => OWNER_ALERT_KIND_LABEL[a.kind];
</script>

<div class="gap-stack-lg flex min-w-0 flex-col">
  <PageHeader title="이상·점검 알림">
    {#snippet meta()}<span class="text-body-sm text-fg-muted">{summary.attention}대 · {summary.alerts}건</span
      >{/snippet}
  </PageHeader>
  <div class="gap-inline-sm flex flex-wrap" role="group" aria-label="알림 종류">
    {#each kinds as kind (kind.value)}
      <Chip size="md" selected={filter === kind.value} count={kind.count} onclick={() => setFilter(kind.value)}
        >{kind.label}</Chip
      >
    {/each}
  </div>
  <div class="gap-stack-lg grid min-w-0 items-start xl:grid-cols-2">
    <section
      aria-label="알림 목록"
      class="rounded-card bg-surface shadow-raised gap-stack-xs p-inset-xs flex min-w-0 flex-col"
    >
      <p class="px-inset-md py-inset-xs text-label-md text-fg-muted">표시 {shown.length}건 / 전체 {summary.alerts}건</p>
      <List items={shown} key={(a) => a.id} label="알림" variant="plain">
        {#snippet item(alert)}
          <AlertCard
            {alert}
            device={data.devices.find((d) => d.id === alert.deviceId)}
            now={data.at}
            selected={selected?.id === alert.id}
            onclick={() => select(alert.id)}
            data-alert={alert.id}
          />
        {/snippet}
        {#snippet empty()}<EmptyState title="표시할 알림 없음">
            {#snippet icon()}<IconTile><Bell class="size-size-icon-lg" /></IconTile>{/snippet}
          </EmptyState>{/snippet}
      </List>
    </section>
    {#if selected && device && SelectedIcon}
      <section
        class="rounded-card bg-surface shadow-raised gap-stack-lg p-inset-lg flex min-w-0 flex-col"
        aria-label="선택한 알림 상세"
        tabindex="-1"
      >
        <div class="gap-inline-md flex items-start justify-between">
          <div class="gap-inline-md flex min-w-0 items-start">
            <IconTile tone={OWNER_ALERT_TONE[selected.kind]}><SelectedIcon class="size-size-icon-lg" /></IconTile>
            <div class="gap-stack-xs flex min-w-0 flex-col">
              <span class="gap-inline-sm flex flex-wrap items-center">
                <StatusPill size="sm" tone={OWNER_ALERT_TONE[selected.kind]} label={kindOf(selected)} />
                <span class="text-label-md text-fg-muted">{device.unit}호기</span>
              </span>
              <h2 class="text-heading-lg break-words">{selected.title}</h2>
            </div>
          </div>
          <Button variant="ghost" tone="neutral" onclick={() => select(null)}>닫기</Button>
        </div>
        <p class="text-body-md">{selected.detail}</p>
        <KeyValueList
          items={[
            { label: '발생 시각', value: fmtDateTime(selected.at) },
            { label: '현장', value: device.site },
            { label: '확인', value: selected.read ? '읽음' : '미확인' },
          ]}
        />
        {#if device.contact}
          <ContactCard name={device.contact.name} role={device.contact.job} phone={device.contact.phone} />
        {:else}
          <p class="text-body-sm text-fg-muted">담당자 미등록</p>
        {/if}
        <div class="gap-inline-sm flex flex-wrap items-center">
          <Button
            onclick={read}
            disabled={selected.read}
            loading={busy}
            variant={selected.read ? 'outline' : 'solid'}
            tone={selected.read ? 'neutral' : 'accent'}>{selected.read ? '읽음으로 표시됨' : '읽음으로 표시'}</Button
          >
          <Button variant="ghost" href={ownerHref(url, 'detail', app, { return: url.pathname + url.search }, device.id)}
            >장비 상세·계약 확인 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
          >
        </div>
        {#if error}<p role="alert" class="text-danger-fg text-body-md">{error}</p>{/if}
      </section>
    {:else if url.searchParams.has('alert')}
      <EmptyState title="이 알림을 조회할 수 없습니다" description="보유 장비의 알림 목록에서 다시 선택하세요." />
    {:else}
      <EmptyState title="선택한 알림 없음">
        {#snippet icon()}<IconTile><Bell class="size-size-icon-lg" /></IconTile>{/snippet}
      </EmptyState>
    {/if}
  </div>
</div>
