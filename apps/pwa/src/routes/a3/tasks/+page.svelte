<script lang="ts">
  // A3-05 업무(열람) — 본사 스코프 전 현장 업무 · 접수·완료 없음 · "확인 요청"만(DISC-015) (specs/task-escalation AC-11)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Case, type TaskState } from '@boomeyes/domain';
  import { Button, EmptyState, StatusPill, TASK_LABEL, TASK_TONE, Tabs, TaskCard, dueLabel, toast } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const SEV = { critical: 0, warning: 1, info: 2 } as const;
  const open = (c: Case) => c.state !== 'done';
  const match = (c: Case, chip: string) =>
    chip === 'all' ? true : chip === 'escalated' ? c.state === 'escalated' : open(c);
  const CHIPS = [
    { id: 'open', label: '미처리' },
    { id: 'escalated', label: '에스컬레이션' },
    { id: 'all', label: '전체' },
  ];
  const tabs = $derived(CHIPS.map((c) => ({ ...c, count: data.cases.filter((x) => match(x, c.id)).length })));
  const visible = $derived(
    data.cases
      .filter((c) => match(c, data.chip))
      .sort((a, b) => SEV[a.severity] - SEV[b.severity] || (a.dueAt < b.dueAt ? -1 : 1)),
  );
  const SUMMARY: TaskState[] = ['new', 'in-progress', 'escalated'];
  const count = (s: TaskState) => data.cases.filter((c) => c.state === s).length;
  const now = $derived(data.clock.now());
  const siteName = (id: string) => data.sites.find((s) => s.id === id)?.name ?? id;
  const select = (id: string) =>
    goto(resolve(`/a3/tasks?filter=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  let busy = $state<string | null>(null);
  async function confirm(c: Case) {
    busy = c.id;
    try {
      await data.api.requestConfirm(c.id, session.user?.userId ?? 'hq01');
      await invalidateAll();
      toast(`확인 요청 — ${c.id} (${siteName(c.siteId)})`);
    } catch (e) {
      toast(`확인 요청 실패 — ${String((e as Error).message)}`);
    } finally {
      busy = null;
    }
  }
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A3-05']}>
  <div class="gap-inline-sm flex flex-wrap" aria-label="업무 요약">
    {#each SUMMARY as s (s)}
      <StatusPill tone={TASK_TONE[s]} label="{TASK_LABEL[s]} {count(s)}" size="sm" />
    {/each}
    <span class="text-label-sm text-fg-muted ml-auto self-center">현장 {data.sites.length} · 열람 전용</span>
  </div>
  <Tabs variant="pill" size="sm" {tabs} value={data.chip} onchange={select} />
  {#if visible.length}
    <ul class="gap-stack-sm flex flex-col" aria-label="업무">
      {#each visible as c (c.id)}
        <li class="gap-stack-xs flex flex-col">
          <TaskCard task={c} href={resolve(`/a3/sites/${c.siteId}` as '/')} due={dueLabel(c.dueAt, now)}>
            {#snippet footer()}
              <span class="text-label-sm text-fg-muted">{siteName(c.siteId)}</span>
              {#if open(c)}
                <Button size="sm" variant="outline" tone="neutral" disabled={busy === c.id} onclick={() => confirm(c)}
                  >확인 요청</Button
                >
              {/if}
            {/snippet}
          </TaskCard>
        </li>
      {/each}
    </ul>
  {:else}
    <EmptyState title="해당하는 업무가 없습니다" description="자사 현장의 업무가 여기에 모입니다." />
  {/if}
</div>
