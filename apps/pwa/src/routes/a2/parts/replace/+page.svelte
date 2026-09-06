<script lang="ts">
  // A2-09 교체·폐기 처리(W2 구조) — due 부품: 사유·작업자·증빙 사진 → 확인(2단계) → due → replaced(재고 −1) · replaced 부품 → discarded (specs/equipment-parts AC-3)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type PartEvent } from '@boomeyes/domain';
  import {
    Button,
    Dialog,
    EmptyState,
    FileUpload,
    PART_EVENT_LABEL,
    PART_GROUP_LABEL,
    PART_STATE_LABEL,
    PART_TONE,
    Select,
    StatusPill,
    TextField,
    Timeline,
    toast,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const actionable = (state: string) => state === 'due' || state === 'replaced';
  let partId = $state(
    data.part ?? data.parts.find((p) => p.state === 'due')?.id ?? data.parts.find((p) => actionable(p.state))?.id ?? '',
  );
  const part = $derived(data.parts.find((p) => p.id === partId) ?? null);
  const mode = $derived(part?.state === 'due' ? 'replace' : part?.state === 'replaced' ? 'discard' : null);
  const stock = $derived(part ? (data.stock.find((s) => s.partNo === part.partNo) ?? null) : null);
  const options = $derived(
    data.parts.map((p) => ({
      value: p.id,
      label: `${p.id} · ${PART_GROUP_LABEL[p.group]} · ${PART_STATE_LABEL[p.state]}`,
      disabled: !actionable(p.state),
    })),
  );
  let reason = $state('마모 한계');
  let worker = $state(data.me?.display ?? '');
  let photo = $state<{ name: string; url?: string } | null>(null);
  let confirm = $state(false);
  let busy = $state(false);
  const REASONS = ['마모 한계', '균열·손상', '체결 불량', '주기 교체', '기타'].map((r) => ({ value: r, label: r }));
  const eventText = (e: PartEvent) =>
    `${PART_EVENT_LABEL[e.kind]}${e.reason ? ` · ${e.reason}` : ''}${e.thicknessMm !== undefined ? ` · ${e.thicknessMm}mm` : ''}`;
  const history = $derived(
    data.events
      .filter((e) => e.partId === part?.id)
      .map((e) => ({ at: e.at, by: e.worker ?? e.by, action: eventText(e), ...(e.note ? { note: e.note } : {}) })),
  );
  const pick = (id: string) => {
    partId = id;
    const u = new URL(location.href); // 다른 쿼리(?state= ?capture=) 유지(QA §3)
    u.searchParams.set('part', id);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  async function run() {
    if (!part || !mode) return;
    const m = mode; // invalidateAll 뒤 part 상태가 바뀌면 mode도 바뀐다 — 처리 종류는 시작 시점 값으로 고정
    busy = true;
    try {
      const by = session.user?.userId ?? 'driver03';
      const p = photo ? { photo: { name: photo.name, ...(photo.url ? { url: photo.url } : {}) } } : {};
      const r =
        m === 'replace'
          ? await data.api.replacePart(part.id, { reason, worker: worker.trim() || by, ...p }, by)
          : await data.api.discardPart(part.id, { reason, ...p }, by);
      await invalidateAll();
      const after = data.stock.find((s) => s.partNo === r.partNo);
      toast(m === 'replace' ? `교체 — ${r.id} · 재고 ${after?.onHand ?? '—'}` : `폐기 — ${r.id}`);
      confirm = false;
      photo = null;
    } catch (e) {
      toast(`${m === 'replace' ? '교체' : '폐기'} 실패 — ${(e as Error).message}`);
      confirm = false;
    } finally {
      busy = false;
    }
  }
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A2-09']}>
  <a href={resolve('/a2/device' as '/')} class="text-label-md text-accent-fg">‹ 내 장비</a>
  <p class="text-body-sm text-fg-muted" data-ref="DISC-044">
    교체는 재고에서 1개를 빼고 이력에 남깁니다 · 발주는 준비 중
  </p>
  <div class="gap-stack-sm flex flex-col">
    <Select label="부품" value={partId} {options} placeholder="선택" onchange={(e) => pick(e.currentTarget.value)} />
    <Button
      variant="outline"
      tone="neutral"
      size="sm"
      block
      disabled
      title="태그 방식이 정해지면 지원합니다"
      data-ref="DISC-043">태그 스캔 — 준비 중</Button
    >
  </div>
  {#if part}
    <div class="gap-inline-sm flex flex-wrap items-center">
      <span class="text-heading-sm">{part.id} · {part.position}</span>
      <StatusPill tone={PART_TONE[part.state]} label={PART_STATE_LABEL[part.state]} size="sm" />
      {#if stock}<span class="text-label-sm text-fg-muted" data-stock={stock.onHand}
          >재고 {stock.onHand} (안전 {stock.safety})</span
        >{/if}
    </div>
    {#if mode}
      <form
        class="gap-stack-sm rounded-card border-border bg-surface p-inset-md flex flex-col border"
        aria-label={mode === 'replace' ? '교체 처리' : '폐기 처리'}
        onsubmit={(e) => (e.preventDefault(), (confirm = true))}
      >
        <Select label="사유" bind:value={reason} options={REASONS} />
        {#if mode === 'replace'}<TextField label="작업자" bind:value={worker} required />{/if}
        <FileUpload
          mode="image"
          label="증빙 사진(선택)"
          onfile={(f) => (photo = { name: f.name, ...(f.url ? { url: f.url } : {}) })}
          disabled={busy}
        />
        <Button
          type="submit"
          size="lg"
          block
          tone={mode === 'discard' ? 'danger' : 'accent'}
          disabled={busy || (mode === 'replace' && !worker.trim())}
          >{mode === 'replace' ? '교체 처리' : '폐기 처리'}</Button
        >
      </form>
    {:else}
      <p class="text-body-sm text-fg-muted">교체 대상·교체됨 부품만 처리할 수 있습니다</p>
    {/if}
    <section class="gap-stack-sm flex flex-col" aria-label="이력">
      <h2 class="text-heading-sm">이력 {history.length}</h2>
      {#if history.length}<Timeline items={history} newestFirst={false} />{:else}<p class="text-body-sm text-fg-muted">
          이력 없음
        </p>{/if}
    </section>
  {:else}
    <EmptyState title="처리할 부품이 없습니다" />
  {/if}

  <Dialog
    bind:open={confirm}
    title={mode === 'replace' ? '교체 확인' : '폐기 확인'}
    destructive={mode === 'discard'}
    onclose={() => (confirm = false)}
  >
    <p class="text-body-md">
      {part?.id} · {part ? PART_GROUP_LABEL[part.group] : ''} — {reason}{mode === 'replace' && stock
        ? ` · 재고 ${stock.onHand} → ${stock.onHand - 1}`
        : ''}
    </p>
    <p class="text-label-sm text-fg-muted">이력에 사유·작업자·증빙이 남습니다</p>
    {#snippet footer()}
      <Button tone={mode === 'discard' ? 'danger' : 'accent'} disabled={busy} onclick={run}
        >{mode === 'replace' ? '교체' : '폐기'} 확정</Button
      >
      <Button variant="ghost" tone="neutral" onclick={() => (confirm = false)}>취소</Button>
    {/snippet}
  </Dialog>
</div>
