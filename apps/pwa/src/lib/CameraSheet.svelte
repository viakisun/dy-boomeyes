<script lang="ts">
  // 카메라 영상 시트(FR-004 · IF-006 "선택 시 본 스트림") — A1-04·A1-05의 타일 터치가 ?cam= 으로 연다.
  // data-scr는 부모 화면을 유지한다: 화면 코드가 바뀌면 mock db 캐시 키(capture|screen|state)가 바뀌어 픽스처가 사라진다.
  import type { Camera, Device, MediaSource } from '@boomeyes/domain';
  import { Badge, BottomSheet, Button } from '@boomeyes/ui';
  import { HealthBadge, SOURCE_LABEL, VideoPlayer } from '@boomeyes/video';
  let {
    camera,
    siblings,
    device,
    media,
    capture = false,
    snapshotEveryMs,
    boxes = [],
    clip,
    onlive,
    onopen,
    onclose,
  }: {
    /** 열 카메라 — null이면 시트가 닫힌다(프로파일 가드에 걸린 딥링크 포함) */
    camera: Camera | null;
    /** 같은 장비의 표시 가능한 채널 — 시트 안에서 전환 */
    siblings: Camera[];
    device?: Device;
    media: MediaSource;
    capture?: boolean;
    snapshotEveryMs: number;
    /** AI 감지 영역 — VideoPlayer가 직접 그린다 */
    boxes?: { x: number; y: number; w: number; h: number; label?: string; score?: number }[];
    /** 저장 영상 재생(FR-005) — 있으면 라이브 대신 이 클립 */
    clip?: { url: string; poster?: string; label: string };
    onlive?: () => void;
    onopen: (id: string) => void;
    onclose: () => void;
  } = $props();
  const label = (c: Camera) => (c.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방');
</script>

<BottomSheet open={!!camera} title={camera ? `${device?.unitNo ?? ''}호기 · ${label(camera)}` : ''} {capture} {onclose}>
  <!-- 본문 전체를 감싼다: VideoPlayer 루트에 data-camera가 있어 닫힌 채 남으면 타일 개수 단언이 깨진다 -->
  {#if camera}
    <div class="gap-stack-sm flex flex-col" data-cam-sheet>
      <div class="gap-inline-sm flex flex-wrap items-center">
        {#each siblings as c (c.id)}
          <Button
            size="sm"
            variant={c.id === camera.id ? 'solid' : 'outline'}
            tone={c.id === camera.id ? 'accent' : 'neutral'}
            onclick={() => onopen(c.id)}>{label(c)}</Button
          >
        {/each}
        <Badge tone="danger" variant={camera.state === 'recording' ? 'solid' : 'subtle'} class="ml-auto"
          >● 녹화 {SOURCE_LABEL[camera.recording === 'edge' ? 'server' : camera.recording]} · {camera.retentionDays}일</Badge
        >
      </div>
      <VideoPlayer
        {camera}
        {media}
        {capture}
        {snapshotEveryMs}
        {boxes}
        {clip}
        {onlive}
        deviceLabel="{device?.unitNo ?? ''}호기"
      />
      <HealthBadge {camera} />
    </div>
  {/if}
</BottomSheet>
