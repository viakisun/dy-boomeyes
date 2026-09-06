<script lang="ts">
  // A1-11 부품 점검 입력(W2 구조) — 부품 선택(스캔 버튼 비활성 · DISC-043) → 실측두께·외관·체결·OEM 합불(+사진) 제출 → installed → inspected(합) · → due(불) · 이력에 실측값·행위자·사진 (specs/equipment-parts AC-2 · FR-035)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type PartEvent } from '@boomeyes/domain';
  import {
    Button,
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
  const eligible = (state: string) => state === 'installed' || state === 'inspected';
  let partId = $state(data.part ?? data.parts.find((p) => eligible(p.state))?.id ?? '');
  const part = $derived(data.parts.find((p) => p.id === partId) ?? null);
  const options = $derived(
    data.parts.map((p) => ({
      value: p.id,
      label: `${p.id} · ${PART_GROUP_LABEL[p.group]} · ${PART_STATE_LABEL[p.state]}`,
      disabled: !eligible(p.state),
    })),
  );
  let thickness = $state('');
  let visual = $state('ok');
  let fastening = $state('ok');
  let verdict = $state('pass');
  let note = $state('');
  let photo = $state<{ name: string; url?: string } | null>(null);
  let busy = $state(false);
  const eventText = (e: PartEvent) =>
    `${PART_EVENT_LABEL[e.kind]}${e.thicknessMm !== undefined ? ` · ${e.thicknessMm}mm` : ''}${e.pass !== undefined ? (e.pass ? ' · 합' : ' · 불') : ''}`;
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
  async function submit() {
    if (!part) return;
    busy = true;
    try {
      const r = await data.api.inspectPart(
        part.id,
        {
          thicknessMm: Number(thickness),
          visual: visual as 'ok' | 'wear' | 'crack',
          fastening: fastening as 'ok' | 'loose',
          pass: verdict === 'pass',
          ...(photo ? { photo: { name: photo.name, ...(photo.url ? { url: photo.url } : {}) } } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
        session.user?.userId ?? 'safety01',
      );
      await invalidateAll();
      toast(`점검 — ${r.id} ${PART_STATE_LABEL[r.state]}`);
      thickness = '';
      note = '';
      photo = null;
    } catch (e) {
      toast(`점검 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A1-11']}>
  <a href={resolve('/a1/monitor/CPB-003' as '/')} class="text-label-md text-accent-fg">‹ 장비 상세</a>
  <p class="text-body-sm text-fg-muted" data-ref="DISC-044 DISC-038">부품별 실측 · 외관 · 체결 · 합불을 입력합니다</p>
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
      <span class="text-label-sm text-fg-muted"
        >기준 {part.baseThicknessMm} mm · 최근 {part.lastThicknessMm ?? '—'} mm</span
      >
    </div>
    <form
      class="gap-stack-sm rounded-card border-border bg-surface p-inset-md flex flex-col border"
      aria-label="부품 점검"
      onsubmit={(e) => (e.preventDefault(), submit())}
    >
      <TextField label="실측 두께(mm)" type="number" step="0.1" min="0.1" bind:value={thickness} required />
      <Select
        label="외관"
        bind:value={visual}
        options={[
          { value: 'ok', label: '양호' },
          { value: 'wear', label: '마모' },
          { value: 'crack', label: '균열' },
        ]}
      />
      <Select
        label="체결"
        bind:value={fastening}
        options={[
          { value: 'ok', label: '양호' },
          { value: 'loose', label: '풀림' },
        ]}
      />
      <Select
        label="OEM 합불"
        bind:value={verdict}
        options={[
          { value: 'pass', label: '합 — 계속 사용' },
          { value: 'fail', label: '불 — 교체 대상' },
        ]}
        help="합불은 입력자 판정 — OEM 기준은 준비 중"
      />
      <FileUpload
        mode="image"
        label="사진(선택)"
        onfile={(f) => (photo = { name: f.name, ...(f.url ? { url: f.url } : {}) })}
        disabled={busy}
      />
      <TextField label="메모" bind:value={note} />
      <Button type="submit" size="lg" block disabled={busy || !eligible(part.state) || !thickness}>점검 제출</Button>
    </form>
    <section class="gap-stack-sm flex flex-col" aria-label="이력">
      <h2 class="text-heading-sm">이력 {history.length}</h2>
      {#if history.length}<Timeline items={history} newestFirst={false} />{:else}<p class="text-body-sm text-fg-muted">
          이력 없음
        </p>{/if}
    </section>
  {:else}
    <EmptyState title="점검할 부품이 없습니다" />
  {/if}
</div>
