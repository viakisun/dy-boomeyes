<script lang="ts">
  // 카메라 헬스 배지 — camera 상태기계 + health. 장애(정지화면·흐림·가림·수신 끊김·AI 판단 불가)는 "정상"으로 표시하지 않는다 (FR-034)
  import type { Camera } from '@boomeyes/domain';
  import { Badge, CAMERA_TONE, StatusPill, fmtTime } from '@boomeyes/ui';
  import { CAMERA_LABEL, HEALTH_LABEL } from './labels';
  let { camera, size = 'sm', showTime = true }: { camera: Camera; size?: 'sm' | 'md'; showTime?: boolean } = $props();
  const faulty = $derived(
    camera.state === 'offline' ||
      camera.state === 'ai-unavailable' ||
      (camera.health !== undefined && camera.health !== 'ok'),
  );
  const label = $derived(
    camera.health && camera.health !== 'ok' && camera.state !== 'offline'
      ? `${CAMERA_LABEL[camera.state]} · ${HEALTH_LABEL[camera.health]}`
      : camera.state === 'offline'
        ? HEALTH_LABEL.lost
        : CAMERA_LABEL[camera.state],
  );
  const tone = $derived(faulty ? (camera.state === 'offline' ? 'neutral' : 'warning') : CAMERA_TONE[camera.state]);
</script>

<span class="gap-inline-xs inline-flex flex-wrap items-center" data-health={camera.health ?? 'ok'} data-faulty={faulty}>
  <StatusPill {tone} {label} {size} solid={!faulty} signal />
  {#if showTime && faulty}<span class="text-label-sm text-fg-muted tabular-nums"
      >마지막 {fmtTime(camera.snapshotAt)}</span
    >{/if}
  {#if camera.backfill}<Badge tone="info" variant="outline"
      >누락분 재전송 {camera.backfill.segments}세그먼트 · {fmtTime(camera.backfill.since)}~</Badge
    >{/if}
</span>
