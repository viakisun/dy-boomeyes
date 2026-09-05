<script lang="ts">
  // A2-03 일일점검 (specs/driver-daily AC-3 · AC-6)
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type InspectionItem } from '@boomeyes/domain';
  import { Banner, ChecklistForm, StatusPill, fmtDateTime, toast } from '@boomeyes/ui';
  let { data } = $props();
  const t = $derived(data.today);
  let items = $state<InspectionItem[]>(structuredClone(data.today.inspection.items));
  let busy = $state(false);
  const online = $derived(typeof navigator === 'undefined' ? true : navigator.onLine);
  const abnormal = $derived(t.inspection.items.filter((i) => !i.ok).length);
  async function submit(list: InspectionItem[]) {
    busy = true;
    try {
      // $state 프록시는 API 경계(structuredClone)를 못 넘는다 → 스냅샷으로 전달
      await data.api.submitInspection(data.userId, $state.snapshot(list));
      await invalidateAll();
      toast('일일점검 제출 완료');
    } finally {
      busy = false;
    }
  }
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A2-03']}>
  <a href={resolve('/a2/today' as '/')} class="text-label-md text-accent-fg">‹ 오늘</a>
  <header class="gap-stack-xs flex flex-col">
    <h2 class="text-heading-lg">작업 전 일일점검</h2>
    <span class="text-body-sm text-fg-muted"
      >{t.device?.id ?? '배정 장비 없음'} · {t.site?.name ?? ''} · {t.inspection.date}</span
    >
  </header>

  {#if !online}<Banner tone="neutral">오프라인 — 제출은 연결 후 가능합니다</Banner>{/if}

  {#if t.inspection.submittedAt}
    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-sm flex flex-col border"
      aria-label="제출 결과"
    >
      <div class="flex items-center justify-between">
        <span class="text-heading-sm">제출 완료</span>
        <StatusPill
          tone={abnormal ? 'warning' : 'success'}
          label={abnormal ? `이상 ${abnormal}건` : '전 항목 정상'}
          size="sm"
        />
      </div>
      <span class="text-body-sm text-fg-muted">{fmtDateTime(t.inspection.submittedAt)} · {data.userId}</span>
      <ul class="divide-border-subtle divide-y">
        {#each t.inspection.items as i (i.id)}
          <li class="py-inset-xs text-body-md flex justify-between">
            <span>{i.label}</span><span class={i.ok ? 'text-success-fg' : 'text-warning-fg'}
              >{i.ok ? '정상' : '이상'}</span
            >
          </li>
        {/each}
      </ul>
    </section>
  {:else if !t.attendance.checkinAt}
    <Banner tone="warning">출근 체크인 후에 점검을 제출할 수 있습니다</Banner>
    <ChecklistForm bind:items disabled />
  {:else}
    <ChecklistForm bind:items disabled={busy || !online} onsubmit={submit} />
  {/if}
</div>
