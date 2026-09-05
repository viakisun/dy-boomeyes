<script lang="ts">
  // 시연 장면 바(specs/demo-scripts AC-7) — ?scene=N 진행자 전용. 링크 href는 앱이 resolve()해서 넘긴다
  import Button from '../primitives/Button.svelte';
  let {
    scene,
    total,
    title,
    prev,
    next,
    onjump,
  }: {
    scene: number;
    total: number;
    title: string;
    prev?: string;
    next?: string;
    /** 장면 6: DemoClock "1시간 경과" */
    onjump?: () => void;
  } = $props();
</script>

<div
  role="region"
  aria-label="시연 장면"
  data-demo-bar
  class="border-border-subtle bg-surface px-page-gutter py-inset-xs text-body-sm text-fg-muted gap-inline-md flex shrink-0 items-center border-t"
>
  <span class="text-label-md text-fg">장면 {scene}/{total}</span>
  <span class="min-w-0 flex-1 truncate">{title}</span>
  {#if onjump}<Button variant="outline" size="sm" onclick={onjump}>1시간 경과</Button>{/if}
  {#if prev}<a href={prev} class="text-accent-fg hover:underline">← 이전</a>{/if}
  {#if next}<a href={next} class="text-accent-fg hover:underline">다음 →</a>{/if}
</div>
