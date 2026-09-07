<script lang="ts">
  // 그림 — 설치 구성도·증빙 사진 자리(카탈로그 Figure). alt 필수 · 캡션 1줄 · 자산 URL은 prop으로 받는다(ui는 자산·mock을 import하지 않는다)
  import { cx } from '../lib/cx';
  let {
    src,
    alt,
    caption,
    aspect = 'video',
    ref,
    class: cls,
  }: { src: string; alt: string; caption?: string; aspect?: 'video' | 'auto'; ref?: string; class?: string } = $props();
</script>

<figure class={cx('rounded-card border-border bg-surface overflow-hidden border', cls)} data-ref={ref}>
  <img {src} {alt} loading="lazy" class={cx('w-full object-cover', aspect === 'video' && 'aspect-video')} />
  {#if caption}<figcaption class="text-label-sm text-fg-muted p-inset-sm">{caption}</figcaption>{/if}
</figure>
