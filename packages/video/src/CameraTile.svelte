<script lang="ts">
  // 카메라 타일 16:9 — 채널 칩(일반/AI) · 상태 배지(domain.video · camera 상태기계) · 스냅샷 시각. 실스트림 대신 삽화 스틸(STILL) + 시각.
  import type { Camera } from '@boomeyes/domain';
  import { CAMERA_TONE, StatusPill, cx } from '@boomeyes/ui';
  import { STILL, type StillId } from './assets';
  import { CAMERA_LABEL } from './labels';
  let {
    camera,
    deviceLabel,
    selected = false,
    compact = false,
    status = true,
    still,
    onclick,
  }: {
    camera: Camera;
    deviceLabel?: string;
    selected?: boolean;
    compact?: boolean;
    /** 타일 안 상태 pill — PWA는 타일 아래 HealthBadge가 같은 정보를 더 자세히 보여 끈다(중복 제거) */
    status?: boolean;
    /** 상황 스틸(예: 인원 접근 이벤트 = 'boom-person') — 없으면 채널 평시 스틸 */
    still?: StillId;
    onclick?: (id: string) => void;
  } = $props();
  const off = $derived(camera.state === 'offline');
  const stillId = $derived<StillId>(still ?? (camera.kind === 'ai' ? 'boom' : 'front'));
  const time = $derived(
    new Date(camera.snapshotAt).toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );
</script>

<button
  type="button"
  onclick={() => onclick?.(camera.id)}
  aria-label="{deviceLabel ?? camera.deviceId} {camera.kind === 'ai' ? 'AI' : '일반'} 카메라 — {CAMERA_LABEL[
    camera.state
  ]}"
  class={cx(
    'group rounded-card focus-visible:outline-focus-ring relative aspect-video w-full overflow-hidden border text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2',
    selected ? 'border-accent-border-strong shadow-raised' : 'border-border hover:shadow-raised',
    off ? 'bg-surface-sunken' : 'bg-media-bg',
  )}
>
  {#if !off}<img
      src={STILL[stillId]}
      alt=""
      data-still={stillId}
      loading="eager"
      class="absolute inset-0 h-full w-full object-cover"
    />{/if}
  {#if camera.state === 'ai-unavailable'}<div
      class="bg-overlay text-heading-sm text-fg-on-inverse absolute inset-0 flex items-center justify-center"
    >
      AI 판단 불가
    </div>{/if}
  {#if camera.kind === 'ai' && camera.health === 'view-changed' && camera.state !== 'ai-unavailable' && !off}<div
      class="bg-overlay text-heading-sm text-fg-on-inverse absolute inset-0 flex items-center justify-center"
    >
      판단 유보
    </div>{/if}
  {#if off}<div class="text-body-sm text-fg-muted absolute inset-0 flex items-center justify-center">
      수신 없음
    </div>{/if}
  <div class="gap-inline-xs p-inset-xs absolute inset-x-0 top-0 flex items-center justify-between">
    <span class="rounded-pill bg-media-scrim px-inset-xs text-label-sm text-media-fg"
      >{camera.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방'}</span
    >
    {#if status}<StatusPill
        tone={CAMERA_TONE[camera.state]}
        label={CAMERA_LABEL[camera.state]}
        size="sm"
        solid
        signal={camera.state === 'live' || camera.state === 'recording'}
      />{/if}
  </div>
  {#if !compact}<div
      class="p-inset-xs text-label-sm text-fg-on-inverse absolute inset-x-0 bottom-0 flex items-center justify-between"
    >
      <span>{deviceLabel ?? camera.deviceId}</span><span class="font-mono tabular-nums">{off ? '—' : time}</span>
    </div>{/if}
</button>
