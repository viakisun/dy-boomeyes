<script lang="ts">
  import { ownerHref, ownerSummary, type OwnerViewProps } from '@boomeyes/domain';
  import Button from '../primitives/Button.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import { fmtDateTime } from '../lib/format';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  let { data, api, app, url, navigate, refresh }: OwnerViewProps = $props();
  const summary = $derived(ownerSummary(data.devices, data.alerts));
  const filter = $derived(url.searchParams.get('filter') ?? 'all');
  const shown = $derived(
    data.alerts.filter(
      (a) =>
        (filter === 'all' || filter === a.kind) &&
        (!url.searchParams.get('device') || a.deviceId === url.searchParams.get('device')),
    ),
  );
  const selected = $derived(shown.find((a) => a.id === url.searchParams.get('alert')));
  const device = $derived(selected && data.devices.find((d) => d.id === selected.deviceId));
  let error = $state('');
  let busy = $state(false);
  function select(id: string | null) {
    const next = new URL(url);
    if (id) next.searchParams.set('alert', id);
    else next.searchParams.delete('alert');
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
</script>

<div class="gap-stack-xl flex flex-col">
  <header class="gap-stack-sm flex flex-col">
    <p class="text-label-md text-fg-muted">장비별 확인과 현장 연락</p>
    <h1 class="text-heading-xl">이상·점검 알림</h1>
    <p class="text-body-md text-fg-muted">{summary.attention}대에서 {summary.alerts}건의 확인이 필요합니다.</p>
  </header>
  <div class="gap-inline-sm flex flex-wrap" role="group" aria-label="알림 종류">
    {#each [['all', '전체'], ['fault', '장비 이상'], ['inspection', '부품 점검'], ['connection', '수신 지연']] as [value, label] (value)}
      <Button
        variant={filter === value ? 'solid' : 'outline'}
        tone={filter === value ? 'accent' : 'neutral'}
        aria-pressed={filter === value}
        onclick={() => {
          const next = new URL(url);
          next.searchParams.set('filter', value ?? 'all');
          next.searchParams.delete('alert');
          navigate(next.pathname + next.search);
        }}>{label}</Button
      >
    {/each}
  </div>
  <div class="gap-stack-xl grid items-start xl:grid-cols-2">
    <section aria-label="알림 목록" class="border-border-subtle bg-surface rounded-card overflow-hidden border">
      <p class="p-inset-lg border-border-subtle text-label-md text-fg-muted border-b">
        표시 {shown.length}건 / 전체 {summary.alerts}건
      </p>
      {#each shown as alert (alert.id)}
        {@const d = data.devices.find((d) => d.id === alert.deviceId)}
        <button
          class="p-inset-lg gap-stack-sm border-border-subtle hover:bg-ui-hover flex w-full flex-col border-b text-left last:border-b-0 {selected?.id ===
          alert.id
            ? 'bg-selected'
            : ''}"
          data-alert={alert.id}
          onclick={() => select(alert.id)}
          aria-pressed={selected?.id === alert.id}
        >
          <span class="gap-inline-sm flex w-full items-center justify-between"
            ><span class="text-label-md text-fg-muted">{d?.unit}호기 · {d?.site}</span><span
              class="text-label-sm text-fg-muted">{alert.read ? '읽음' : '미확인'}</span
            ></span
          >
          <span class="text-heading-sm">{alert.title}</span><span class="text-body-sm text-fg-muted"
            >{fmtDateTime(alert.at)}</span
          >
        </button>
      {:else}<EmptyState title="표시할 알림이 없습니다" description="다른 종류 또는 전체 알림을 확인하세요." />{/each}
    </section>
    {#if selected && device}
      <section
        class="border-border-subtle bg-surface rounded-card gap-stack-lg p-inset-xl flex flex-col border"
        aria-label="선택한 알림 상세"
        tabindex="-1"
      >
        <div class="gap-inline-md flex items-start justify-between">
          <div>
            <p class="text-label-md text-accent-fg">{device.unit}호기</p>
            <h2 class="text-heading-lg mt-stack-xs">{selected.title}</h2>
          </div>
          <Button variant="ghost" tone="neutral" onclick={() => select(null)}>닫기</Button>
        </div>
        <p class="text-body-md text-fg-muted">{selected.detail}</p>
        <dl class="text-body-md gap-stack-md grid grid-cols-2">
          <dt class="text-fg-muted">발생 시각</dt>
          <dd>{fmtDateTime(selected.at)}</dd>
          <dt class="text-fg-muted">현장</dt>
          <dd>{device.site}</dd>
          <dt class="text-fg-muted">담당자</dt>
          <dd>{device.contact?.name ?? '담당자 미등록'}</dd>
        </dl>
        {#if device.contact}<p class="text-body-md">
            연락처 {device.contact.phone}<span class="text-fg-muted"> · 시연용 연락처</span>
          </p>{/if}
        <div class="gap-stack-sm flex flex-col">
          <Button onclick={read} disabled={selected.read} loading={busy}
            >{selected.read ? '읽음으로 표시됨' : '읽음으로 표시'}</Button
          >
          <p class="text-body-sm text-fg-muted">읽음 표시는 장비 이상을 해소하거나 점검을 완료하지 않습니다.</p>
        </div>
        {#if error}<p role="alert" class="text-danger-fg text-body-md">{error}</p>{/if}
        <a
          class="text-accent-fg text-label-lg min-h-size-touch-min gap-inline-sm inline-flex items-center font-semibold"
          href={ownerHref(url, 'detail', app, { return: url.pathname + url.search }, device.id)}
          >장비 상세·계약 확인 <ArrowRight class="size-size-icon-md" aria-hidden="true" /></a
        >
      </section>
    {:else if url.searchParams.has('alert')}
      <EmptyState title="이 알림을 조회할 수 없습니다" description="보유 장비의 알림 목록에서 다시 선택하세요." />
    {:else}
      <div class="border-border-subtle rounded-card p-inset-xl text-body-md text-fg-muted border">
        알림을 선택하면 해당 장비의 현장 담당자와 발생 정보를 함께 확인할 수 있습니다.
      </div>
    {/if}
  </div>
</div>
