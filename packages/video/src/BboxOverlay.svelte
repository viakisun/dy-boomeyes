<script lang="ts">
  // AI 이벤트 bbox 오버레이 — 정규화 좌표(0~1) SVG. 텍스트 대체(sr-only) 필수 (video-basics 접근성)
  export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
    score?: number;
  }
  let { boxes = [], tone = 'warning' }: { boxes?: Box[]; tone?: 'warning' | 'danger' } = $props();
  const stroke = $derived(
    tone === 'danger' ? 'var(--sys-color-danger-solid)' : 'var(--sys-color-domain-video-ai-solid)',
  );
</script>

{#if boxes.length}
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-hidden="true"
    data-bbox
  >
    {#each boxes as b, i (i)}
      <rect
        x={b.x * 100}
        y={b.y * 100}
        width={b.w * 100}
        height={b.h * 100}
        fill="none"
        {stroke}
        stroke-width="0.8"
        vector-effect="non-scaling-stroke"
      />
      <text x={b.x * 100} y={Math.max(4, b.y * 100 - 1.5)} font-size="4" fill={stroke} font-family="sans-serif"
        >{b.label ?? '객체'}{b.score !== undefined ? ` ${b.score.toFixed(2)}` : ''}</text
      >
    {/each}
  </svg>
  <span class="sr-only">
    {#each boxes as b, i (i)}{b.label ?? '객체'}
      {i + 1}{b.score !== undefined ? ` (${Math.round(b.score * 100)}%)` : ''}.
    {/each}
  </span>
{/if}
