<script lang="ts">
  // 서류 카드(카탈로그 DocumentCard) — 유형 배지 · 상태 pill(domain.doc) · 만료 D-n · 액션 슬롯(48px 버튼은 호출부)
  import type { Doc } from '@boomeyes/domain';
  import type { Snippet } from 'svelte';
  import { DOC_TONE, cx } from '../lib/cx';
  import { DOC_KIND_LABEL, DOC_STATE_LABEL } from '../lib/labels';
  import Badge from './Badge.svelte';
  import StatusPill from './StatusPill.svelte';
  let {
    doc,
    due,
    selected = false,
    class: cls,
    actions,
  }: {
    doc: Doc;
    due?: { label: string; overdue: boolean };
    selected?: boolean;
    class?: string;
    actions?: Snippet;
  } = $props();
</script>

<article
  class={cx(
    'gap-stack-xs rounded-card p-inset-md flex flex-col border',
    selected ? 'border-accent-border-strong bg-selected' : 'border-border bg-surface',
    cls,
  )}
  data-doc={doc.id}
  data-state={doc.state}
  aria-label="{doc.subject} · {DOC_STATE_LABEL[doc.state]}"
>
  <div class="gap-inline-sm flex flex-wrap items-center">
    <Badge tone="neutral" variant="outline">{DOC_KIND_LABEL[doc.kind]}</Badge>
    <span class="text-heading-sm">{doc.subject}</span>
  </div>
  <div class="gap-inline-sm text-body-sm text-fg-muted flex flex-wrap items-center">
    <StatusPill tone={DOC_TONE[doc.state]} label={DOC_STATE_LABEL[doc.state]} size="sm" />
    {#if due}<span class={cx('tabular-nums', due.overdue && 'text-danger-fg font-semibold')}>만료 {due.label}</span
      >{/if}
    <span class="text-label-sm ml-auto">{doc.id}</span>
  </div>
  {#if doc.state === 'rejected' && doc.history.at(-1)?.note}
    <p class="text-body-sm text-danger-fg">반려 사유: {doc.history.at(-1)?.note}</p>
  {/if}
  {#if actions}<div class="gap-inline-sm pt-stack-xs flex flex-col">{@render actions()}</div>{/if}
</article>
