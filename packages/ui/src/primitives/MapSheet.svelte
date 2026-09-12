<script lang="ts">
  // 지도 위 바텀 시트(카탈로그 MapSheet) — 비모달 3단(collapsed · half · expanded). 지도 조작을 막지 않는다(BottomSheet는 모달 dialog).
  // 손잡이 버튼 = 키보드(ArrowUp/Down · Home/End) · 클릭(한 단 위로, 끝이면 접기) · 드래그(놓은 방향으로 한 단). 위치는 transform, 토큰만.
  import type { Snippet } from 'svelte';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { cx } from '../lib/cx';
  import IconButton from './IconButton.svelte';
  export type MapSheetSnap = 'collapsed' | 'half' | 'expanded';
  const ORDER: MapSheetSnap[] = ['collapsed', 'half', 'expanded'];
  let {
    snap = $bindable('half'),
    label,
    onsnap,
    class: cls,
    children,
  }: {
    snap?: MapSheetSnap;
    label: string;
    onsnap?: (snap: MapSheetSnap) => void;
    class?: string;
    children: Snippet;
  } = $props();
  const id = `map-sheet-${Math.random().toString(36).slice(2, 8)}`;
  function set(next: MapSheetSnap) {
    if (next === snap) return;
    snap = next;
    onsnap?.(next);
  }
  const step = (delta: number) => set(ORDER[Math.min(2, Math.max(0, ORDER.indexOf(snap) + delta))]!);
  function onkeydown(event: KeyboardEvent) {
    const map: Record<string, () => void> = {
      ArrowUp: () => step(1),
      ArrowDown: () => step(-1),
      Home: () => set('expanded'),
      End: () => set('collapsed'),
    };
    const action = map[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }
  let dragStart: number | null = null;
  let dragged = false;
  const DRAG_PX = 40;
  function onpointerdown(event: PointerEvent) {
    dragged = false;
    dragStart = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function onpointerup(event: PointerEvent) {
    if (dragStart === null) return;
    const dy = event.clientY - dragStart;
    dragStart = null;
    dragged = Math.abs(dy) >= DRAG_PX;
    if (dy <= -DRAG_PX) step(1);
    else if (dy >= DRAG_PX) step(-1);
  }
  // 드래그로 끝난 pointerup 뒤에 따라오는 click은 무시한다(한 단 더 움직이는 사고 방지)
  function onclick() {
    if (dragged) {
      dragged = false;
      return;
    }
    if (snap === 'expanded') set('collapsed');
    else step(1);
  }
</script>

<section
  data-map-sheet
  data-snap={snap}
  aria-label={label}
  class={cx(
    'map-sheet rounded-t-dialog bg-surface shadow-modal border-border absolute inset-x-0 bottom-0 flex h-full flex-col border border-b-0',
    cls,
  )}
>
  <div class="gap-inline-sm px-inset-sm flex shrink-0 items-center">
    <button
      type="button"
      class="min-h-size-touch-min flex flex-1 cursor-grab touch-none flex-col items-center justify-center"
      aria-label={snap === 'expanded' ? '시트 접기' : '시트 펼치기'}
      aria-expanded={snap !== 'collapsed'}
      aria-controls={id}
      {onclick}
      {onkeydown}
      {onpointerdown}
      {onpointerup}
      onpointercancel={() => (dragStart = null)}
    >
      <span class="bg-border-strong rounded-pill h-size-icon-xs w-size-icon-lg" aria-hidden="true"></span>
    </button>
    <IconButton
      variant="ghost"
      tone="neutral"
      label={snap === 'collapsed' ? '시트 펼치기' : '시트 접기'}
      onclick={() => (snap === 'collapsed' ? set('half') : set('collapsed'))}
      >{#if snap === 'collapsed'}<ChevronUp class="size-size-icon-md" aria-hidden="true" />{:else}<ChevronDown
          class="size-size-icon-md"
          aria-hidden="true"
        />{/if}</IconButton
    >
  </div>
  <div
    {id}
    class="gap-stack-lg px-inset-md pb-inset-lg flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
  >
    {@render children()}
  </div>
</section>

<style>
  .map-sheet {
    transition: transform var(--sys-motion-duration-moderate) var(--sys-motion-easing-standard);
    will-change: transform;
  }
  .map-sheet[data-snap='collapsed'] {
    transform: translateY(calc(100% - var(--sys-size-row-default) * 2));
  }
  .map-sheet[data-snap='half'] {
    transform: translateY(50%);
  }
  .map-sheet[data-snap='expanded'] {
    transform: translateY(var(--sys-space-inset-xl));
  }
  @media (prefers-reduced-motion: reduce) {
    .map-sheet {
      transition: none;
    }
  }
</style>
