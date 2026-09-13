<script lang="ts">
  // 호기 카메라 벽 — 시안의 호기 화면은 지도 자리에 카메라 6분할을 놓는다(«확정 2026-09-12»).
  // 웹 3×2 · PWA 2×3(390px에서 3열은 한 타일이 100px 남짓이라 무엇도 읽히지 않는다).
  // 타일은 앱이 넘긴 live 스니펫이 그린다 — ui는 video를 import하지 않는다(경계).
  import type { Snippet } from 'svelte';
  import VideoOff from '@lucide/svelte/icons/video-off';
  import type { OwnerApp, OwnerCamera, OwnerDevice } from '@boomeyes/domain';
  import { cx } from '../lib/cx';
  import EmptyState from '../primitives/EmptyState.svelte';
  import IconTile from '../primitives/IconTile.svelte';
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
    live: Snippet<[OwnerCamera, string, boolean]>;
    class?: string;
  } = $props();
  const available = $derived(cameras.filter((c) => c.available));
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
        // 웹 3열 · PWA 2열 — 열 수는 밀도가 아니라 폭이 정한다.
        // 웹은 벽 높이를 행이 나눠 갖고, PWA는 타일 비율을 지키고 넘치면 스크롤한다
        // (390px에서 높이를 3등분하면 라벨이 영상을 덮는다).
        app === 'pwa' ? 'grid-cols-2' : 'grid-cols-2 lg:h-full lg:grid-cols-3 lg:grid-rows-2',
      )}
    >
      {#each available as camera (camera.id)}
        <li class="min-w-0">
          {@render live(camera, `${device.unit}호기 ${camera.label}`, capture)}
        </li>
      {/each}
    </ul>
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
