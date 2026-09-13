<script lang="ts">
  // 접기 — 제목 줄을 눌러 본문을 펼친다(시안의 호기 화면은 지표 아래 네 묶음을 접어 둔다).
  // <details>를 쓴다: 브라우저가 열림 상태·키보드·검색 내 찾기를 맡고, 스크립트 없이도 동작한다.
  // Tabs(role=tab)와 다르다 — 여러 묶음이 동시에 열릴 수 있고 그중 하나만 고르는 것이 아니다.
  import type { Snippet } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { cx, FOCUS } from '../lib/cx';
  let {
    title,
    /** 제목 오른쪽의 수·상태 같은 짧은 보조 정보 */
    meta,
    open = false,
    class: cls,
    children,
  }: {
    title: string;
    meta?: string;
    open?: boolean;
    class?: string;
    children: Snippet;
  } = $props();
</script>

<details {open} class={cx('border-border-subtle rounded-card border', cls)} data-fold={title}>
  <summary
    class={cx(
      'gap-inline-sm px-inset-md py-inset-sm min-h-size-touch-min flex cursor-pointer list-none items-center justify-between',
      FOCUS,
    )}
  >
    <span class="gap-inline-sm flex min-w-0 items-center">
      <ChevronDown class="size-size-icon-md text-fg-muted shrink-0 transition-transform" aria-hidden="true" />
      <span class="text-label-lg font-semibold">{title}</span>
    </span>
    {#if meta}<span class="text-body-sm text-fg-muted tabular-nums">{meta}</span>{/if}
  </summary>
  <div class="px-inset-md pb-inset-md gap-stack-sm flex min-w-0 flex-col">
    {@render children()}
  </div>
</details>

<style>
  /* 기본 화살표를 숨기고 위 셰브론만 쓴다 */
  summary::-webkit-details-marker,
  summary::marker {
    display: none;
    content: '';
  }
  details[open] summary :global(svg:first-child) {
    transform: rotate(180deg);
  }
</style>
