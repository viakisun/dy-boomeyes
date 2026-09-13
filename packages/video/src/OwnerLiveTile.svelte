<script lang="ts">
  // 현황 호기 패널의 실시간 영상 타일 — 6초 샘플 루프(실스트림 없음, INTENT §5). 캡처에서는 자동 재생 없이 포스터.
  // 해제 규칙은 OwnerVideo와 같다: pause → src 제거 → load(요소가 사라져도 재생이 남지 않게).
  import { onDestroy } from 'svelte';
  import type { OwnerCamera } from '@boomeyes/domain';
  import { StatusPill } from '@boomeyes/ui';
  let {
    camera,
    label,
    capture = false,
    fill = false,
    class: cls = '',
  }: { camera: OwnerCamera; label: string; capture?: boolean; fill?: boolean; class?: string } = $props();
  let video = $state<HTMLVideoElement>();
  $effect(() => {
    const player = video;
    return () => {
      if (!player) return;
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  });
  onDestroy(() => video?.pause());
</script>

<figure
  data-live-tile
  data-camera={camera.id}
  data-mode="live"
  class="rounded-card bg-media-bg relative w-full overflow-hidden {fill ? 'h-full' : 'aspect-video'} {cls}"
>
  <video
    bind:this={video}
    src={camera.url}
    poster={camera.poster}
    muted
    loop
    playsinline
    preload="metadata"
    autoplay={!capture}
    aria-label={label}
    class="h-full w-full {fill ? 'object-contain' : 'object-cover'}"
  ></video>
  <!-- 벽의 타일은 187px까지 좁아진다 — 두 겹의 안내를 다 얹으면 영상이 글자에 덮인다.
       좁은 타일은 한 줄로 줄이고, 전체 화면(fill)에서만 길게 밝힌다. 어느 쪽이든 시연 클립임은 말한다. -->
  {#if fill}
    <StatusPill
      solid
      size="sm"
      tone="neutral"
      label="실시간 예시 · {camera.durationSec}초 샘플 반복"
      class="top-inset-sm left-inset-sm absolute"
    />
  {/if}
  <figcaption class="bg-media-scrim text-media-fg px-inset-sm py-inset-xs text-body-sm absolute inset-x-0 bottom-0">
    {camera.label} · {fill ? '실제 장비 스트림이 아닌 시연 클립' : '시연 클립'}
  </figcaption>
</figure>
