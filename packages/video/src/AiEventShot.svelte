<script lang="ts">
  // AI 이벤트 스냅샷 — 경고가 난 그 프레임에 탐지 상자와 접근 주의 구역을 얹는다
  // (FR-028 · 시안 «확정 2026-09-12»의 호기 화면 오버레이).
  // 라이브 타일에 그리지 않는 이유: 구역은 이 스틸의 프레임 좌표로 잰 보정값이고,
  // AI 카메라의 실시간 클립은 붐 끝 크롭이라 같은 좌표가 아니다 — 다른 프레임에 얹으면 거짓이 된다.
  import type { OwnerAiEvent } from '@boomeyes/domain';
  import { STILL } from './assets';
  import BboxOverlay, { type Box } from './BboxOverlay.svelte';
  let { event, class: cls = '' }: { event: OwnerAiEvent; class?: string } = $props();
  const boxes = $derived([
    ...(event.zone
      ? [{ ...event.zone, kind: 'zone' as const, label: '접근 주의 구역', tone: 'warning' as const }]
      : []),
    ...(event.bbox ? [{ ...event.bbox, label: '작업자', tone: 'danger' as const }] : []),
  ] satisfies Box[]);
</script>

<figure data-ai-shot={event.id} class="gap-stack-xs flex min-w-0 flex-col {cls}">
  <!-- 캡션은 프레임 밖에 둔다 — 안에 깔면 구역의 아래쪽을 덮는다 -->
  <div class="rounded-card bg-media-bg relative aspect-video w-full overflow-hidden">
    <img src={STILL['boom-person']} alt="{event.title} 순간의 화면" class="h-full w-full object-cover" />
    <BboxOverlay {boxes} />
  </div>
  <figcaption class="text-body-sm text-fg-muted">AI CCTV 판단 근거 · 시연 화면</figcaption>
</figure>
