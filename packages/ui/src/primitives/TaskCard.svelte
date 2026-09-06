<script lang="ts">
  // 업무 카드 — 유형 · 제목 · 상태(TASK_TONE + 라벨) · 기한 · 심각도 (색 + 텍스트 병행). 본문은 링크 · footer 스니펫은 카드 안 액션 행(링크 밖 — A3-05 확인 요청)
  import type { Snippet } from 'svelte';
  import type { Case } from '@boomeyes/domain';
  import { cx, FOCUS, SEVERITY_TONE, TASK_TONE } from '../lib/cx';
  import { CASE_KIND_LABEL, SEVERITY_LABEL, TASK_LABEL } from '../lib/labels';
  import Badge from './Badge.svelte';
  import StatusDot from './StatusDot.svelte';
  import StatusPill from './StatusPill.svelte';
  let {
    task,
    href,
    due,
    selected = false,
    class: cls,
    footer,
  }: {
    task: Case;
    href: string;
    due?: { label: string; overdue: boolean };
    selected?: boolean;
    class?: string;
    footer?: Snippet;
  } = $props();
</script>

<article
  data-state={task.state}
  class={cx(
    'rounded-card flex flex-col border',
    selected ? 'border-accent-border-strong bg-selected' : 'border-border bg-surface hover:border-border-strong',
    cls,
  )}
>
  <a
    {href}
    aria-current={selected ? 'true' : undefined}
    class={cx('gap-stack-xs rounded-card p-inset-md flex flex-col', FOCUS)}
  >
    <div class="gap-inline-sm flex items-start">
      <Badge tone="neutral" variant="outline">{CASE_KIND_LABEL[task.kind]}</Badge>
      <span class="text-body-md text-fg min-w-0 flex-1 font-medium">{task.title}</span>
    </div>
    <div class="gap-inline-sm text-label-md flex flex-wrap items-center">
      <StatusPill tone={TASK_TONE[task.state]} label={TASK_LABEL[task.state]} size="sm" />
      <span class="gap-inline-xs inline-flex items-center">
        <StatusDot tone={SEVERITY_TONE[task.severity]} />{SEVERITY_LABEL[task.severity]}
      </span>
      {#if due}<span class={cx('tabular-nums', due.overdue ? 'text-danger-fg font-semibold' : 'text-fg-muted')}
          >기한 {due.label}</span
        >{/if}
      <span class="text-fg-muted ml-auto">{task.id}</span>
    </div>
  </a>
  {#if footer}<div
      class="border-border-subtle px-inset-md py-inset-sm gap-inline-sm flex items-center justify-between border-t"
    >
      {@render footer()}
    </div>{/if}
</article>
