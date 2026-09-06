<script lang="ts">
  // A2-04 내 장비 (specs/driver-daily AC-5) — 통신·전압·단선·고장코드 + 수송관·필터 도달률 임계
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import {
    CAMERA_TONE,
    EQUIPMENT_TONE,
    ERROR_CODE_LABEL,
    EmptyState,
    StatusPill,
    TelemetryGauge,
    TelemetryStrip,
    fmtDateTime,
  } from '@boomeyes/ui';
  let { data } = $props();
  const EQUIP_LABEL = { normal: '정상', caution: '주의', fault: '고장', offline: '두절', maintenance: '정비' } as const;
  const CAM_LABEL = {
    live: '라이브',
    snapshot: '스냅샷',
    recording: '녹화 중',
    offline: '수신 끊김',
    'ai-unavailable': 'AI 판단 불가',
  } as const;
  const d = $derived(data.today.device);
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A2-04']}>
  <a href={resolve('/a2/today' as '/')} class="text-label-md text-accent-fg">‹ 오늘</a>
  {#if d}
    <header class="gap-stack-xs flex flex-col">
      <div class="flex items-center justify-between">
        <h2 class="text-heading-lg">{d.id} · {d.unitNo}호기</h2>
        <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} />
      </div>
      <span class="text-body-sm text-fg-muted"
        >{data.today.site?.name ?? d.siteId} · 마지막 수신 {fmtDateTime(d.telemetry.at)}</span
      >
      {#if d.telemetry.errorCode}<span class="text-body-sm text-danger-fg"
          >{d.telemetry.errorCode} — {ERROR_CODE_LABEL[d.telemetry.errorCode] ?? ''}</span
        >{/if}
    </header>

    <TelemetryStrip telemetry={d.telemetry} />

    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-md flex flex-col border"
      aria-label="마모·교체 부품"
    >
      <h3 class="text-heading-sm">마모·교체 부품 도달률</h3>
      <TelemetryGauge label="수송관" value={d.telemetry.pipeRatio} />
      <TelemetryGauge label="필터" value={d.telemetry.filterRatio} />
      <span class="text-body-sm text-fg-muted" data-ref="DISC-013 DISC-014"
        >임계에 가까워지면 현장 안전관리자에게 점검 알림이 갑니다</span
      >
    </section>

    <section class="gap-stack-sm flex flex-col" aria-label="카메라">
      <h3 class="text-heading-sm">카메라 {data.cameras.length}</h3>
      <ul class="rounded-card border-border bg-surface divide-border-subtle flex flex-col divide-y border">
        {#each data.cameras as c (c.id)}
          <li class="px-inset-md py-inset-xs flex items-center justify-between">
            <span class="text-body-md">{c.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방'}</span>
            <StatusPill
              tone={CAMERA_TONE[c.state]}
              label={CAM_LABEL[c.state]}
              size="sm"
              signal={c.state === 'live' || c.state === 'recording'}
            />
          </li>
        {/each}
      </ul>
    </section>
    <a href={resolve('/a2/parts/replace' as '/')} class="text-body-md text-accent-fg" data-link="parts"
      >마모·교체 부품 교체·폐기 처리 ›</a
    >
  {:else}
    <EmptyState title="배정된 장비가 없습니다" />
  {/if}
</div>
