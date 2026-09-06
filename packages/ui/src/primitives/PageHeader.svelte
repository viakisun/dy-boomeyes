<script lang="ts">
  // 페이지 헤더(카탈로그 PageHeader, DY-design §11.1) — 제목 · 부제 1줄(≤ 60자) · 메타 칩 행 · 우측 액션 ≤ 2 · 아래 탭 슬롯
  // ref = 부제의 근거 SSOT ID(공백 구분) → data-ref. 화면 문자열에는 ID를 쓰지 않는다(§12.1-2) — 시연 모드 "근거" 토글에서만 칩으로 보인다
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    title,
    description,
    ref,
    meta,
    actions,
    children,
    class: cls,
  }: {
    title: string;
    description?: string;
    ref?: string;
    meta?: Snippet;
    actions?: Snippet;
    children?: Snippet;
    class?: string;
  } = $props();
</script>

<header class={cx('gap-stack-sm flex flex-col', cls)}>
  <div class="gap-inline-md flex items-start justify-between">
    <div class="gap-stack-xs flex min-w-0 flex-col">
      <h1 class="text-heading-xl">{title}</h1>
      {#if description}<p class="text-body-sm text-fg-muted" data-ref={ref}>{description}</p>{/if}
      {#if meta}<div class="gap-inline-sm flex flex-wrap items-center">{@render meta()}</div>{/if}
    </div>
    {#if actions}<div class="gap-inline-sm flex shrink-0 items-center">{@render actions()}</div>{/if}
  </div>
  {@render children?.()}
</header>
