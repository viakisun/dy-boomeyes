<script lang="ts">
  // 카메라 전체 화면 — 타일을 누르면 열린다(시안 «확정 2026-09-12» · PWA는 사용자 결정 «탭하면 전체 화면»).
  // <dialog>의 모달을 쓴다: Esc·포커스 가둠·최상위 레이어가 딸려 오고 z 유틸리티가 필요 없다.
  import type { Snippet } from 'svelte';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import X from '@lucide/svelte/icons/x';
  import type { OwnerCamera, OwnerDevice } from '@boomeyes/domain';
  import { cx, FOCUS } from '../lib/cx';
  let {
    device,
    cameras,
    index = $bindable(null),
    capture = false,
    live,
  }: {
    device: OwnerDevice;
    cameras: OwnerCamera[];
    /** 열려 있는 카메라의 자리. null이면 닫혀 있다. */
    index?: number | null;
    capture?: boolean;
    live: Snippet<[OwnerCamera, string, boolean, boolean]>;
  } = $props();
  let el = $state<HTMLDialogElement>();
  const current = $derived(index === null ? null : (cameras[index] ?? null));
  const nameOf = (camera: OwnerCamera) => `${device.unit}호기 ${camera.label}`;
  const step = (by: number) => {
    if (index === null || cameras.length === 0) return;
    index = (index + by + cameras.length) % cameras.length;
  };
  $effect(() => {
    if (!el) return;
    if (current && !el.open) el.showModal();
    else if (!current && el.open) el.close();
  });
</script>

<dialog
  bind:this={el}
  onclose={() => (index = null)}
  onkeydown={(e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  }}
  data-camera-viewer={current ? device.id : undefined}
  aria-label="{device.unit}호기 카메라 전체 화면"
  class="bg-media-bg text-media-fg backdrop:bg-overlay m-0 h-full max-h-none w-full max-w-none border-0 p-0"
>
  {#if current}
    <div class="flex h-full flex-col">
      <header class="gap-inline-sm p-inset-md flex items-center justify-between">
        <h2 class="text-heading-sm min-w-0 truncate">{nameOf(current)}</h2>
        <button
          type="button"
          onclick={() => (index = null)}
          aria-label="전체 화면 닫기"
          class={cx(
            'size-size-control-md rounded-control hover:bg-media-scrim flex shrink-0 items-center justify-center',
            FOCUS,
          )}><X class="size-size-icon-md" /></button
        >
      </header>
      <div class="px-inset-md relative flex min-h-0 flex-1 items-center justify-center">
        <!-- 타일이 영역을 채우고 영상이 레터박스된다 — 세로·가로 어느 쪽이 좁아도 잘리지 않는다 -->
        <div class="h-full w-full">
          {@render live(current, nameOf(current), capture, true)}
        </div>
        <div class="px-inset-md pointer-events-none absolute inset-0 flex items-center justify-between">
          {#each [{ by: -1, label: '이전 카메라' }, { by: 1, label: '다음 카메라' }] as nav (nav.by)}
            <button
              type="button"
              onclick={() => step(nav.by)}
              aria-label={nav.label}
              class={cx(
                'size-size-control-lg rounded-pill bg-media-scrim pointer-events-auto flex items-center justify-center',
                FOCUS,
              )}
              >{#if nav.by === -1}<ChevronLeft class="size-size-icon-md" />{:else}<ChevronRight
                  class="size-size-icon-md"
                />{/if}</button
            >
          {/each}
        </div>
      </div>
      <!-- 필름 띠 — 포스터 이미지라 ui가 video를 import하지 않는다.
           좁은 화면에서 여섯을 한 줄에 놓으면 한 칸이 55px이라 라벨이 읽히지 않는다 — 3열 두 줄로. -->
      <ul
        class="gap-inline-xs p-inset-md max-w-layout-content-max mx-auto grid w-full list-none grid-cols-3 sm:grid-cols-6"
        aria-label="카메라 목록"
      >
        {#each cameras as camera, i (camera.id)}
          <li class="min-w-0">
            <button
              type="button"
              onclick={() => (index = i)}
              aria-current={i === index ? 'true' : undefined}
              class={cx(
                'rounded-control relative block aspect-video w-full overflow-hidden border',
                i === index ? 'border-media-fg' : 'border-transparent opacity-70',
                FOCUS,
              )}
            >
              <img src={camera.poster} alt="" class="h-full w-full object-cover" />
              <span
                class="bg-media-scrim text-media-fg px-inset-xs text-label-sm absolute inset-x-0 bottom-0 truncate text-left"
                >{camera.label}</span
              >
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</dialog>
