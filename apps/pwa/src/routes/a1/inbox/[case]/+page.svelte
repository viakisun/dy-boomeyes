<script lang="ts">
  // A1-03 업무 상세 (specs/task-escalation AC-3 접수 · AC-4 고장코드·장비 요약·정비 호출)
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    CASE_KIND_LABEL,
    EQUIPMENT_TONE,
    ERROR_CODE_LABEL,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusDot,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
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
  const canComplete = $derived(data.task.state === 'in-progress');
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
</script>

<div class="gap-stack-md pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A1-03']}>
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
        <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} size="sm" />
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
    {:else if canComplete}
      <Button
        size="lg"
        block
        tone="neutral"
        variant="outline"
        disabled={busy}
        onclick={() => run('완료 확인', () => data.api.completeCase(data.task.id, me(), '완료 확인'))}>완료 확인</Button
      >
    {:else}
      <span class="text-body-sm text-fg-muted self-center">{TASK_LABEL[data.task.state]} 상태 — 할 일이 없습니다</span>
    {/if}
  </div>
</div>
