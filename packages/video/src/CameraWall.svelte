<script lang="ts">
  // 카메라 월(카탈로그 CameraWall) — 월보드 다크 강제([data-theme=dark], DY-design §9) · 현장 프로파일 AX-1(P-LITE면 AI 채널 숨김) · 타일 클릭 → onopen
  import type { Camera, Device, Site } from '@boomeyes/domain';
  import CameraTile from './CameraTile.svelte';
  import { visibleIn } from './wall';
  let {
    cameras,
    devices,
    sites,
    deviceId = null,
    title = '카메라 월',
    onopen,
  }: {
    cameras: Camera[];
    devices: Device[];
    sites: Site[];
    /** 있으면 그 호기만 */
    deviceId?: string | null;
    title?: string;
    onopen?: (cameraId: string) => void;
  } = $props();
  const wallCams = $derived(
    cameras.filter((c) => (!deviceId || c.deviceId === deviceId) && visibleIn(c, devices, sites)),
  );
  const selected = $derived(deviceId ? devices.find((d) => d.id === deviceId) : undefined);
  const label = (c: Camera) => `${devices.find((d) => d.id === c.deviceId)?.unitNo ?? '?'}호기`;
</script>

<section class="gap-stack-sm flex flex-col">
  <h2 class="text-heading-sm">
    {title}
    {#if selected}<span class="text-body-sm text-fg-muted">— {selected.unitNo}호기 {wallCams.length}채널</span>{/if}
  </h2>
  <div
    class="gap-inline-md rounded-card bg-media-bg p-inset-md grid grid-cols-2 md:grid-cols-4"
    data-theme="dark"
    data-wall
  >
    {#each wallCams as c (c.id)}<CameraTile camera={c} deviceLabel={label(c)} onclick={onopen} />{/each}
  </div>
  {#if !wallCams.length}<p class="text-body-sm text-fg-muted">표시할 채널이 없습니다</p>{/if}
</section>
