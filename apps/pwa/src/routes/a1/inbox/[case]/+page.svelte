<script lang="ts">
  // A1-03 업무 상세 (specs/task-escalation AC-3 접수 · AC-4 고장코드·장비 요약·정비 호출) · A1-08 완료 처리 시트(AC-9, ?sheet=complete)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import {
    Badge,
    BottomSheet,
    Button,
    CASE_KIND_LABEL,
    DOC_STATE_LABEL,
    DocumentCard,
    EQUIPMENT_TONE,
    ERROR_CODE_LABEL,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusDot,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    TextField,
    Timeline,
    cx,
    dueLabel,
    fmtDateTime,
    toast,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const EQUIP_LABEL = { normal: '정상', caution: '주의', fault: '고장', offline: '두절', maintenance: '정비' } as const;
  let busy = $state(false);
  const me = () => session.user?.userId ?? 'safety01';
  const canAccept = $derived(data.task.state === 'new' || data.task.state === 'escalated');
  const canComplete = $derived(data.task.state === 'in-progress' && data.task.kind !== 'doc');
  // 서류 업무(kind=doc): 승인/반려(사유 필수)가 완료다 — reviewDoc이 서류 상태기계와 업무를 함께 닫는다 (documents AC-3)
  const canReview = $derived(
    data.task.kind === 'doc' &&
      !!data.doc &&
      (data.doc.state === 'review' || data.doc.state === 'submitted') &&
      data.task.state !== 'done',
  );
  let reason = $state('');
  const openReview = () => goto(resolve(withSheet(true, 'review') as '/'));
  async function review(decision: 'approved' | 'rejected') {
    if (!data.doc) return;
    await run(decision === 'approved' ? '승인' : '반려', () =>
      data.api.reviewDoc(data.doc!.id, decision, me(), reason.trim() || undefined),
    );
    reason = '';
    await goto(resolve(withSheet(false) as '/'));
  }
  async function run(label: string, fn: () => Promise<unknown>) {
    busy = true;
    try {
      await fn();
      await invalidateAll();
      toast(`${label} — ${data.task.id}`);
    } finally {
      busy = false;
    }
  }
  const due = $derived(dueLabel(data.task.dueAt, data.clock.now()));
  // 완료 처리 시트(A1-08): 조치 내용 필수 → in-progress → done. 시트 열림은 URL(?sheet=complete)이 결정 — 뒤로가기로 닫힌다
  let note = $state('');
  // 시트 열기/닫기는 현재 URL의 다른 쿼리(?state= ?capture= ?scene=)를 유지한다 — mock db 캐시 키가 바뀌면 안 된다(QA §3)
  const withSheet = (on: boolean, kind: 'complete' | 'review' = 'complete') => {
    const u = new URL(location.href);
    if (on) u.searchParams.set('sheet', kind);
    else u.searchParams.delete('sheet');
    return u.pathname + u.search;
  };
  const openSheet = () => goto(resolve(withSheet(true) as '/'));
  const closeSheet = () => goto(resolve(withSheet(false) as '/'));
  async function complete() {
    await run('완료 확인', () => data.api.completeCase(data.task.id, me(), note.trim()));
    note = '';
    await goto(resolve(withSheet(false) as '/'));
  }
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={data.sheet ? SCR['A1-08'] : SCR['A1-03']}>
  <a href={resolve('/a1/inbox' as '/')} class="text-label-md text-accent-fg">‹ 업무함</a>
  <header class="gap-stack-xs flex flex-col">
    <div class="gap-inline-sm flex flex-wrap items-center">
      <Badge tone="neutral" variant="outline">{CASE_KIND_LABEL[data.task.kind]}</Badge>
      <span class="text-label-md text-fg-muted">{data.task.id}</span>
      <StatusPill tone={TASK_TONE[data.task.state]} label={TASK_LABEL[data.task.state]} size="sm" />
    </div>
    <h2 class="text-heading-lg">{data.task.title}</h2>
    <div class="gap-inline-md text-body-sm text-fg-muted flex flex-wrap">
      <span class="gap-inline-xs inline-flex items-center"
        ><StatusDot tone={SEVERITY_TONE[data.task.severity]} />{SEVERITY_LABEL[data.task.severity]}</span
      >
      <span class={cx('tabular-nums', due.overdue && 'text-danger-fg font-semibold')}>기한 {due.label}</span>
      <span>{data.site?.name ?? data.task.siteId}</span>
    </div>
  </header>

  {#if data.device}
    {@const d = data.device}
    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-sm flex flex-col border"
      aria-label="장비"
    >
      <div class="flex items-center justify-between">
        <span class="text-heading-sm">{d.id} · {d.unitNo}호기</span>
        <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} size="sm" signal />
      </div>
      <dl class="gap-x-inline-md gap-y-stack-xs text-body-sm grid grid-cols-[auto_1fr]">
        <dt class="text-fg-muted">전압</dt>
        <dd class={cx('tabular-nums', d.telemetry.voltageStatus !== 'normal' && 'text-danger-fg font-semibold')}>
          {d.telemetry.voltage}V · {d.telemetry.voltageStatus === 'normal' ? '정상' : '이상'}
        </dd>
        <dt class="text-fg-muted">통신 · GPS</dt>
        <dd>{d.telemetry.lte} · {d.telemetry.gpsFix ? 'fix' : 'no-fix'}</dd>
        <dt class="text-fg-muted">단선</dt>
        <dd>{d.telemetry.harness === 'ok' ? '정상' : '단선'}</dd>
        <dt class="text-fg-muted">고장코드</dt>
        <dd>
          {#if d.telemetry.errorCode}<span class="text-code-md text-danger-fg">{d.telemetry.errorCode}</span>
            <span class="text-fg-muted"> — {ERROR_CODE_LABEL[d.telemetry.errorCode] ?? '설명 없음'}</span>{:else}—{/if}
        </dd>
        <dt class="text-fg-muted">마지막 수신</dt>
        <dd class="tabular-nums">{fmtDateTime(d.telemetry.at)}</dd>
      </dl>
      <Button
        variant="outline"
        tone="neutral"
        size="sm"
        disabled={busy}
        onclick={() => run('정비 담당 호출', () => data.api.callMaintenance(data.task.id, me()))}>정비 담당 호출</Button
      >
    </section>
  {/if}

  {#if data.doc}
    <section class="gap-stack-sm flex flex-col" aria-label="서류">
      <h3 class="text-heading-sm">서류</h3>
      <DocumentCard
        doc={data.doc}
        due={data.doc.expiresAt ? dueLabel(data.doc.expiresAt, data.clock.now()) : undefined}
      />
      {#if data.doc.file?.url}<img
          src={data.doc.file.url}
          alt="제출된 {data.doc.subject}"
          class="rounded-card max-h-size-control-lg object-contain"
        />{/if}
    </section>
  {/if}

  <section class="gap-stack-sm flex flex-col" aria-label="이력">
    <h3 class="text-heading-sm">이력</h3>
    <Timeline items={data.task.history} />
  </section>

  <div
    class="bg-surface border-border-subtle px-page-gutter py-inset-sm gap-inline-sm max-w-layout-frame-mobile bottom-layout-bottomnav-height fixed inset-x-0 mx-auto flex border-t"
    style="z-index: var(--sys-z-nav); margin-bottom: env(safe-area-inset-bottom)"
  >
    {#if canAccept}
      <Button size="lg" block disabled={busy} onclick={() => run('접수', () => data.api.acceptCase(data.task.id, me()))}
        >접수</Button
      >
    {:else if canReview}
      <Button size="lg" block disabled={busy} onclick={() => review('approved')}>승인</Button>
      <Button size="lg" block variant="outline" tone="danger" disabled={busy} onclick={openReview}>반려</Button>
    {:else if canComplete}
      <Button size="lg" block tone="neutral" variant="outline" disabled={busy} onclick={openSheet}>완료 확인</Button>
    {:else}
      <span class="text-body-sm text-fg-muted self-center">{TASK_LABEL[data.task.state]} 상태 — 할 일이 없습니다</span>
    {/if}
  </div>

  <BottomSheet open={data.review} title="반려 사유" onclose={closeSheet}>
    <div class="gap-stack-sm flex flex-col">
      <p class="text-body-sm text-fg-muted">{data.doc?.subject} · {data.doc ? DOC_STATE_LABEL[data.doc.state] : ''}</p>
      <TextField label="반려 사유(필수)" bind:value={reason} placeholder="예: 사본 흐림 — 원본 재촬영" />
    </div>
    {#snippet footer()}
      <Button size="lg" block tone="danger" disabled={busy || !reason.trim()} onclick={() => review('rejected')}
        >반려</Button
      >
      <Button size="lg" block variant="ghost" tone="neutral" onclick={closeSheet}>닫기</Button>
    {/snippet}
  </BottomSheet>

  <BottomSheet open={data.sheet} title="완료 처리" capture onclose={closeSheet}>
    <div class="gap-stack-sm flex flex-col" data-scr={SCR['A1-08']}>
      <p class="text-body-sm text-fg-muted">{data.task.id} · {data.task.title}</p>
      <TextField label="조치 내용(필수)" bind:value={note} placeholder="예: 전압 릴레이 교체 · 입력 전원 점검" />
      <p class="text-label-sm text-fg-muted" data-ref="DISC-015">
        완료 확인은 현장 안전관리자가 합니다 · 조치 내용은 이력에 남습니다
      </p>
    </div>
    {#snippet footer()}
      <Button size="lg" block disabled={busy || !note.trim()} onclick={complete}>완료 확인</Button>
      <Button size="lg" block variant="ghost" tone="neutral" onclick={closeSheet}>닫기</Button>
    {/snippet}
  </BottomSheet>
</div>
