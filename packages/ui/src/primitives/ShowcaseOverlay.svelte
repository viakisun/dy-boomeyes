<script lang="ts">
  // 쇼케이스 오버레이(카탈로그 ShowcaseOverlay) — 화면 루트(문서 루트 아님)에 data-theme=dark 강제(DY-design §9) · 워터마크(읽기 전용 · 마스킹 · 정책 근거는 ref/data-ref) · 자식은 액션 없이 표시만
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    label = '쇼케이스',
    watermark = '읽기 전용 · 개인정보 마스킹',
    note,
    ref,
    class: cls,
    children,
  }: {
    label?: string;
    watermark?: string;
    note?: string;
    /** 워터마크 행의 근거 SSOT ID(data-ref) — 시연 모드 근거 토글에서만 보인다 */
    ref?: string;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<div
  class={cx(
    'bg-canvas text-fg rounded-card p-inset-lg gap-stack-lg min-h-layout-panel-height relative flex flex-col overflow-hidden',
    cls,
  )}
  data-theme="dark"
  data-showcase
  role="document"
  aria-label={label}
>
  <div
    class="gap-inline-md text-label-sm text-fg-muted flex flex-wrap items-center justify-between"
    data-watermark
    data-ref={ref}
  >
    <span>{watermark}</span>
    {#if note}<span>{note}</span>{/if}
  </div>
  {@render children?.()}
</div>
