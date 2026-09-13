<script lang="ts">
  // 호기 카메라 벽 — 시안의 호기 화면은 지도 자리에 카메라 6분할을 놓는다(«확정 2026-09-12»).
  // 웹 3×2 · PWA 2×3(390px에서 3열은 한 타일이 100px 남짓이라 무엇도 읽히지 않는다).
  // 타일은 앱이 넘긴 live 스니펫이 그린다 — ui는 video를 import하지 않는다(경계).
  import type { Snippet } from 'svelte';
  import Maximize2 from '@lucide/svelte/icons/maximize-2';
  import VideoOff from '@lucide/svelte/icons/video-off';
  import type { OwnerApp, OwnerCamera, OwnerDevice } from '@boomeyes/domain';
  import { cx, FOCUS } from '../lib/cx';
  import EmptyState from '../primitives/EmptyState.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import CameraViewer from './CameraViewer.svelte';
  let {
    device,
    cameras,
    app,
    capture = false,
    live,
    class: cls,
  }: {
    device: OwnerDevice;
    cameras: OwnerCamera[];
    app: OwnerApp;
    capture?: boolean;
    live: Snippet<[OwnerCamera, string, boolean, boolean]>;
    class?: string;
  } = $props();
  const available = $derived(cameras.filter((c) => c.available));
  // 전체 화면으로 연 카메라의 자리(available 기준). 닫히면 null.
  let full = $state<number | null>(null);
</script>

<section
  data-owner-cameras={device.id}
  aria-label="{device.unit}호기 카메라"
  class={cx('bg-media-bg rounded-card min-w-0 overflow-hidden', cls)}
>
  {#if available.length > 0}
    <ul
      class={cx(
        'gap-inline-xs grid list-none p-0',
        // 웹 3열 · PWA 2열 — 열 수는 밀도가 아니라 폭이 정한다(390px에서 3열은 한 칸이 100px 남짓이다).
        // 타일은 어느 쪽이든 16:9를 지킨다 — 칸을 억지로 채우면 영상이 레터박스로 줄고 빈 띠만 남는다.
        app === 'pwa' ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3',
      )}
    >
      {#each available as camera, i (camera.id)}
        <li class="relative min-w-0">
          {@render live(camera, `${device.unit}호기 ${camera.label}`, capture, false)}
          <!-- 타일을 누르면 전체 화면(시안 «확정 2026-09-12»). 타일 전체가 대상이고 모서리 표식은 그것을 알린다. -->
          <button
            type="button"
            onclick={() => (full = i)}
            aria-label="{device.unit}호기 {camera.label} 전체 화면"
            class={cx('rounded-card absolute inset-0 flex items-start justify-end', FOCUS)}
          >
            <span class="bg-media-scrim text-media-fg rounded-control m-inline-xs p-inline-xs">
              <Maximize2 class="size-size-icon-sm" />
            </span>
          </button>
        </li>
      {/each}
    </ul>
    <CameraViewer {device} cameras={available} bind:index={full} {capture} {live} />
  {:else}
    <EmptyState
      title={device.connection === 'detached' ? '단말기 미장착' : '영상 미확보'}
      description={device.connection === 'detached'
        ? '보관 중인 장비에는 카메라 단말기가 없습니다.'
        : '수신이 재개되면 카메라 영상이 이곳에 표시됩니다.'}
    >
      {#snippet icon()}<IconTile><VideoOff class="size-size-icon-lg" /></IconTile>{/snippet}
    </EmptyState>
  {/if}
</section>
