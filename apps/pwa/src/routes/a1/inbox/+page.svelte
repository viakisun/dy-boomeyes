<script lang="ts">
  // A1-02 업무함 (specs/task-escalation AC-1 · AC-2 · AC-8)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Case, type TaskState } from '@boomeyes/domain';
  import { EmptyState, StatusPill, TASK_LABEL, TASK_TONE, Tabs, TaskCard, dueLabel } from '@boomeyes/ui';
  let { data } = $props();
  const SEV = { critical: 0, warning: 1, info: 2 } as const;
  const isFault = (c: Case) => c.kind === 'fault' || c.kind === 'comm';
  const open = (c: Case) => c.state !== 'done';
  const match = (c: Case, chip: string) => (chip === 'all' ? true : chip === 'fault' ? isFault(c) && open(c) : open(c));
  const CHIPS = [
    { id: 'open', label: '미처리' },
    { id: 'all', label: '전체' },
    { id: 'fault', label: '고장·이상' },
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
    goto(resolve(`/a1/inbox?filter=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A1-02']}>
  <div class="gap-inline-sm flex flex-wrap" aria-label="업무 요약">
    {#each SUMMARY as s (s)}
      <StatusPill tone={TASK_TONE[s]} label="{TASK_LABEL[s]} {count(s)}" size="sm" />
    {/each}
    <span class="text-label-sm text-fg-muted ml-auto self-center">{siteName(data.sites[0]?.id ?? '')}</span>
  </div>
  <Tabs variant="pill" size="sm" {tabs} value={data.chip} onchange={select} />
  {#if visible.length}
    <ul class="gap-stack-sm flex flex-col" aria-label="업무">
      {#each visible as c (c.id)}
        <li><TaskCard task={c} href={resolve(`/a1/inbox/${c.id}` as '/')} due={dueLabel(c.dueAt, now)} /></li>
      {/each}
    </ul>
  {:else}
    <EmptyState title="처리할 업무가 없습니다" description="새 이벤트가 오면 여기에 쌓입니다." />
  {/if}
</div>
