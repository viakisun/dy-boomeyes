<script lang="ts">
  // 컨텍스트 헤더 — 상세 페이지 상단. 스크롤로 히어로가 사라지면 제목·상태·주 행동만 남긴 축약 바가 sticky로 붙는다.
  // 축약 바 높이만큼 scroll-margin을 두어 포커스가 가려지지 않는다(WCAG 2.4.11). 모션 감소 환경은 전환 없이 즉시.
  import type { Snippet } from 'svelte';
  import { cx } from '../lib/cx';
  let {
    title,
    subtitle,
    status,
    actions,
    hero,
    class: cls,
  }: {
    title: string;
    subtitle?: string;
    status?: Snippet;
    actions?: Snippet;
    /** 큰 헤더 본체(히어로) — 이 영역이 화면 밖으로 나가면 축약 바가 나타난다 */
    hero: Snippet;
    class?: string;
  } = $props();
  let sentinel = $state<HTMLElement>();
  let compact = $state(false);
  // 스크롤 컨테이너([data-owner-scroll] 또는 window)의 스크롤마다 센티널 위치로 판정 — 교차 관찰자보다 결정적(캡처 도구의 scrollIntoView 왕복에도 정확)
  $effect(() => {
    const el = sentinel;
    if (!el) return;
    const scroller = el.closest<HTMLElement>('[data-owner-scroll]');
    const update = () => {
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      compact = el.getBoundingClientRect().bottom < top;
    };
    update();
    const target: EventTarget = scroller ?? window;
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      target.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  });
</script>

<div class={cx('relative', cls)}>
  <div bind:this={sentinel} class="h-px" aria-hidden="true"></div>
  {#if compact}
    <div
      class="bg-surface border-border-subtle top-stack-xs z-sticky gap-inline-md px-inset-md py-inset-xs rounded-card shadow-raised sticky flex items-center border"
    >
      <span class="gap-inline-sm flex min-w-0 flex-1 items-baseline">
        <span class="text-heading-sm truncate">{title}</span>
        {#if subtitle}<span class="text-body-sm text-fg-muted truncate">{subtitle}</span>{/if}
        {@render status?.()}
      </span>
      {@render actions?.()}
    </div>
  {/if}
  {@render hero()}
</div>
