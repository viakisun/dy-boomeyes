<script lang="ts">
  // 플레이어 — 라이브(루프 MP4) / 스냅샷(주기 폴링) 전환 · 헬스 배지 · bbox · 정지/재생. capture 모드는 첫 프레임 정지·폴링 없음 (결정적 캡처)
  import type { Camera, MediaSource } from '@boomeyes/domain';
  import { untrack } from 'svelte';
  import { Button, cx, fmtTime } from '@boomeyes/ui';
  import BboxOverlay, { type Box } from './BboxOverlay.svelte';
  import HealthBadge from './HealthBadge.svelte';
  let {
    camera,
    media,
    capture = false,
    snapshotEveryMs = 5_000,
    boxes = [],
    deviceLabel,
    clip,
    onlive,
    mode = $bindable(camera.state === 'snapshot' ? 'snapshot' : 'live'),
    class: cls,
  }: {
    camera: Camera;
    media: MediaSource;
    capture?: boolean;
    snapshotEveryMs?: number;
    boxes?: Box[];
    deviceLabel?: string;
    /** 저장 영상 재생 — 있으면 라이브·스냅샷 대신 이 클립. 반복하지 않는다(끝나면 다시 재생) */
    clip?: { url: string; poster?: string; label: string };
    /** 저장 영상에서 라이브로 돌아가기 */
    onlive?: () => void;
    mode?: 'live' | 'snapshot';
    class?: string;
  } = $props();
  let live = $state<{ kind: 'mp4' | 'hls'; url: string; poster?: string } | null>(null);
  let snap = $state<{ url: string; at: string } | null>(null);
  let paused = $state(untrack(() => capture)); // capture 모드는 첫 프레임 정지(초기값만)
  const off = $derived(camera.state === 'offline' || camera.health === 'lost');
  $effect(() => {
    const id = camera.id;
    media.live(id).then((r) => (live = r));
  });
  $effect(() => {
    const id = camera.id;
    let alive = true;
    if (clip) return; // 저장 영상 재생 중에는 스냅샷 폴링을 끈다
    const refresh = () => media.snapshot(id).then((r) => alive && (snap = r));
    refresh();
    if (capture) return;
    const timer = setInterval(refresh, snapshotEveryMs);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  });
</script>

<div
  class={cx('bg-media-bg rounded-card relative aspect-video w-full overflow-hidden', cls)}
  data-camera={camera.id}
  data-mode={mode}
  data-frame={clip ? 'clip' : undefined}
>
  {#if off}
    <div class="text-media-fg text-body-md absolute inset-0 flex flex-col items-center justify-center">
      <span>수신 끊김</span><span class="text-label-sm text-media-muted">마지막 {fmtTime(camera.snapshotAt)}</span>
    </div>
  {:else if clip}
    <video
      class="h-full w-full object-cover"
      src={clip.url}
      poster={clip.poster}
      muted
      playsinline
      autoplay={!capture}
      preload={capture ? 'metadata' : 'auto'}
      bind:paused
      aria-label="{deviceLabel ?? camera.deviceId} 저장 영상 {clip.label}"
    ></video>
  {:else if mode === 'live' && live}
    <video
      class="h-full w-full object-cover"
      src={live.url}
      poster={live.poster}
      muted
      loop
      playsinline
      autoplay={!capture}
      preload={capture ? 'metadata' : 'auto'}
      bind:paused
      aria-label="{deviceLabel ?? camera.deviceId} {camera.kind === 'ai' ? 'AI' : '일반'} 카메라 라이브(대체 영상)"
    ></video>
  {:else if snap}
    <img
      class="h-full w-full object-cover"
      src={snap.url}
      alt="{deviceLabel ?? camera.deviceId} 스냅샷 {fmtTime(snap.at)}"
    />
  {:else}
    <div class="text-media-muted text-body-sm absolute inset-0 flex items-center justify-center">영상 준비 중</div>
  {/if}
  {#if camera.state === 'ai-unavailable'}
    <div class="bg-overlay text-heading-sm text-fg-on-inverse absolute inset-0 flex items-center justify-center">
      AI 판단 불가
    </div>
  {/if}
  <BboxOverlay {boxes} />
  <div class="gap-inline-xs p-inset-xs absolute inset-x-0 top-0 flex items-start justify-between">
    <span class="rounded-pill bg-media-scrim px-inset-xs text-label-sm text-media-fg"
      >{camera.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방'}</span
    >
    <HealthBadge {camera} />
  </div>
  <div class="gap-inline-xs p-inset-xs absolute inset-x-0 bottom-0 flex items-center justify-between">
    {#if clip}
      <span class="gap-inline-xs flex items-center">
        <span class="rounded-pill bg-media-scrim px-inset-xs text-label-sm text-media-fg">저장 영상 · {clip.label}</span
        >
        <Button size="sm" variant="outline" tone="neutral" onclick={onlive}>라이브</Button>
      </span>
    {:else}
      <span class="gap-inline-xs flex" role="group" aria-label="영상 모드">
        <Button
          size="sm"
          variant={mode === 'live' ? 'solid' : 'outline'}
          tone={mode === 'live' ? 'accent' : 'neutral'}
          aria-pressed={mode === 'live'}
          disabled={off}
          onclick={() => (mode = 'live')}>라이브</Button
        >
        <Button
          size="sm"
          variant={mode === 'snapshot' ? 'solid' : 'outline'}
          tone={mode === 'snapshot' ? 'accent' : 'neutral'}
          aria-pressed={mode === 'snapshot'}
          disabled={off}
          onclick={() => (mode = 'snapshot')}>스냅샷</Button
        >
      </span>
    {/if}
    <span class="gap-inline-xs flex items-center">
      {#if (clip || mode === 'live') && !off}<Button
          size="sm"
          variant="outline"
          tone="neutral"
          onclick={() => (paused = !paused)}>{paused ? '재생' : '정지'}</Button
        >{/if}
      <span class="rounded-pill bg-media-scrim px-inset-xs text-label-sm text-media-fg font-mono tabular-nums"
        >{fmtTime(mode === 'snapshot' && snap ? snap.at : camera.snapshotAt)}</span
      >
    </span>
  </div>
</div>
