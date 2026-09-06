<script lang="ts">
  // 시연 장면 바(specs/demo-scripts AC-7) — ?scene=N 진행자 전용. 링크 href는 앱이 resolve()해서 넘긴다
  // 웨이브·mock 표기는 여기(시연 모드)에서만 — 셸 푸터·앱 정보에는 내지 않는다(DY-design §12.1-7)
  // "근거" 토글: 문서 루트 data-demo-refs → [data-ref] 요소 뒤에 SSOT ID 칩(아래 :global CSS, 변수만). 장면 바가 사라지면 끈다
  import { CURRENT_WAVE } from '@boomeyes/domain';
  import Button from '../primitives/Button.svelte';
  import { applyDemoRefs, demoRefs } from '../lib/demo-refs.svelte';
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
  $effect(() => () => applyDemoRefs(false));
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
  <Button
    variant={demoRefs.on ? 'solid' : 'outline'}
    tone="neutral"
    size="sm"
    aria-pressed={demoRefs.on}
    onclick={() => applyDemoRefs(!demoRefs.on)}>근거</Button
  >
  {#if prev}<a href={prev} class="text-accent-fg hover:underline">← 이전</a>{/if}
  {#if next}<a href={next} class="text-accent-fg hover:underline">다음 →</a>{/if}
  <span class="text-label-sm">wave {CURRENT_WAVE} · mock</span>
</div>

<style>
  /* 근거 칩 — 시연 모드 토글이 켜진 동안만, 토큰 변수만 쓴다(hex·px 없음) */
  :global([data-demo-refs] [data-ref]::after) {
    content: attr(data-ref);
    font-family: var(--sys-type-label-sm-font-family);
    font-size: var(--sys-type-label-sm-font-size);
    font-weight: var(--sys-type-label-sm-font-weight);
    line-height: var(--sys-type-label-sm-line-height);
    color: var(--sys-color-accent-fg);
    background: var(--sys-color-accent-bg);
    border-radius: var(--sys-radius-pill);
    padding-inline: var(--sys-space-inline-xs);
    margin-inline-start: var(--sys-space-inline-xs);
    white-space: nowrap;
    vertical-align: middle;
  }
</style>
