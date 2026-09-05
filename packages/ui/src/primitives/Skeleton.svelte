<script lang="ts">
  // 로딩 자리(300ms 이후 표시는 호출부 책임) — shape text/rect/circle
  import { cx } from '../lib/cx';
  let { shape = 'text', class: cls }: { shape?: 'text' | 'rect' | 'circle'; class?: string } = $props();
  const SHAPE = {
    text: 'h-size-icon-sm rounded-control w-full',
    rect: 'h-size-control-lg rounded-card w-full',
    circle: 'size-size-icon-lg rounded-pill',
  };
</script>

<div class={cx('bg-ui animate-pulse', SHAPE[shape], cls)} aria-hidden="true"></div>
