<script lang="ts">
  // B1-08 이벤트 복기(W2 구조) — 헤더(event_id·종류·장비·t0·알림·업무) · 4레인(일반 CCTV · AI CCTV · 바디캠 · CPB 상태/부품 이력) 공통 시각축 + 커서(←/→ 1초 · 레인 클릭 · 슬라이더) · 소스 없는 레인 "없음" · 원본 보존 잠금(NFR-015) · 삭제·편집 없음 · 영상은 루프 클립(seek 없음, 목업) · ±1초 동기(NFR-014)는 표기만 (specs/event-replay AC-1~3 · DISC-039 · DISC-044)
  import { resolve } from '$app/paths';
  import { SCR, type ReplayLane, type ReplaySource } from '@boomeyes/domain';
  import {
    Badge,
    EmptyState,
    KeyValueList,
    PageHeader,
    SEVERITY_LABEL,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    fmtDateTime,
    fmtTime,
  } from '@boomeyes/ui';
  import { VideoPlayer } from '@boomeyes/video';
  let { data } = $props();
  const ev = $derived(data.event);
  const t0 = $derived(ev ? Date.parse(ev.at) : 0);
  const win = $derived(ev?.windowSec ?? 60);
  // 공통 커서 — t0 기준 초. 4레인이 같은 값을 읽는다(AC-2)
  let cursor = $state(0);
  const cursorAt = $derived(new Date(t0 + cursor * 1000).toISOString());
  const pct = (iso: string) => Math.max(0, Math.min(100, (((Date.parse(iso) - t0) / 1000 + win) / (2 * win)) * 100));
  const LANES: { key: ReplaySource; label: string }[] = [
    { key: 'general', label: '일반 CCTV' },
    { key: 'ai', label: 'AI CCTV' },
    { key: 'bodycam', label: '바디캠' },
    { key: 'cpb', label: 'CPB 상태/부품 이력' },
  ];
  const camOf = (lane: ReplayLane) => data.cameras.find((c) => c.id === lane.cameraId) ?? null;
  const seekLane = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    cursor = Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * 2 * win - win);
  };
  const onkey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') cursor = Math.max(-win, cursor - 1);
    else if (e.key === 'ArrowRight') cursor = Math.min(win, cursor + 1);
    else return;
    e.preventDefault();
  };
  const KIND_LABEL: Record<string, string> = {
    voltage: '전압 이상',
    comm: '통신 두절',
    pipe: '수송관',
    filter: '필터',
    error: '고장코드',
    'ai-person': 'AI 사람 접근',
    'camera-health': '카메라 헬스',
    harness: '단선',
    gps: 'GPS',
    doc: '서류',
  };
</script>

<svelte:window onkeydown={onkey} />

<div class="gap-stack-lg flex min-w-0 flex-col" data-scr={SCR['B1-08']} data-cursor={cursor}>
  {#if !ev}
    <EmptyState title="이벤트 {data.id} 없음" description="등록된 이벤트가 아닙니다" tone="danger" ref="DISC-039">
      {#snippet action()}
        <a href={resolve('/b1/dash' as '/')} class="text-body-md text-accent-fg">관제 대시보드로</a>
      {/snippet}
    </EmptyState>
  {:else}
    <PageHeader
      title="이벤트 복기 — {ev.id}"
      description="알림 시각 기준 ±60초 · 4소스 동기 재생"
      ref="DISC-039 NFR-014"
    >
      {#snippet actions()}
        {#if ev.locked}<Badge tone="danger" variant="solid" ref="NFR-015">원본 보존</Badge>{/if}
      {/snippet}
    </PageHeader>
    <div class="gap-inline-lg grid md:grid-cols-2">
      <KeyValueList
        label="이벤트"
        items={[
          { label: 'event_id', value: ev.id },
          {
            label: '종류',
            value: `${KIND_LABEL[ev.kind] ?? ev.kind}${data.alert ? ` · ${SEVERITY_LABEL[data.alert.severity]}` : ''}`,
          },
          { label: '장비', value: data.device ? `${data.device.id} · ${data.device.unitNo}호기` : ev.deviceId },
          { label: 't0 · 창', value: `${fmtDateTime(ev.at)} · ±${ev.windowSec}초` },
        ]}
      />
      <KeyValueList
        label="연결"
        items={[
          { label: '알림', value: data.alert ? `${data.alert.id} — ${data.alert.message}` : ev.alertId },
          {
            label: '업무',
            value: data.task
              ? `${data.task.id} — ${data.task.title} (${TASK_LABEL[data.task.state]})`
              : (ev.caseId ?? '없음'),
          },
          { label: '보존', value: ev.locked ? '원본 보존 — 복기 완료 전에는 삭제되지 않습니다' : '잠금 없음' },
          { label: '동기', value: '공통 시각 오차 ±1초 목표 — 검증 준비 중', muted: true },
        ]}
      />
    </div>
    {#if data.task}
      <div class="gap-inline-sm flex items-center">
        <StatusPill tone={TASK_TONE[data.task.state]} label={TASK_LABEL[data.task.state]} size="sm" />
        <a href={resolve(`/b1/inbox?case=${data.task.id}` as '/')} class="text-body-sm text-accent-fg"
          >업무 {data.task.id} 열기 ›</a
        >
      </div>
    {/if}

    <section class="gap-stack-sm flex flex-col" aria-label="복기 타임라인">
      <div class="gap-inline-md flex flex-wrap items-center justify-between">
        <h2 class="text-heading-md">
          복기 타임라인 <span class="text-body-sm text-fg-muted">t0 −{win}s ~ +{win}s</span>
        </h2>
        <div class="gap-inline-sm flex items-center">
          <span class="text-body-sm tabular-nums" data-cursor-label
            >커서 t0{cursor >= 0 ? '+' : ''}{cursor}s · {fmtTime(cursorAt)}</span
          >
          <input
            type="range"
            min={-win}
            max={win}
            step="1"
            bind:value={cursor}
            aria-label="커서(초)"
            class="accent-accent"
          />
          <span class="text-label-sm text-fg-muted">←/→ 1초 · 레인 클릭</span>
        </div>
      </div>
      {#each LANES as lane (lane.key)}
        {@const l = ev.lanes[lane.key]}
        <div class="gap-inline-md grid grid-cols-[auto_minmax(0,1fr)] items-center" data-lane={lane.key}>
          <div class="gap-stack-xs flex flex-col">
            <span class="text-label-md whitespace-nowrap">{lane.label}</span>
            <span class="text-label-sm text-fg-muted tabular-nums" data-lane-time
              >{l.available ? fmtTime(cursorAt) : '없음'}</span
            >
          </div>
          <div
            class="rounded-control bg-surface-sunken h-size-control-lg relative w-full cursor-crosshair overflow-hidden"
            onclick={seekLane}
            role="presentation"
          >
            {#if l.available}
              {#each l.segments as seg (seg.from)}
                <div
                  class="bg-accent-bg-subtle border-accent-border-strong absolute inset-y-0 border-x"
                  style="left: {pct(seg.from)}%; width: {pct(seg.to) - pct(seg.from)}%"
                  title={seg.label}
                ></div>
              {/each}
              <ol class="absolute inset-0" aria-label="{lane.label} 레인">
                {#each l.markers as m (m.at + m.label)}
                  <li
                    class="absolute top-0 flex h-full items-center"
                    style="left: {pct(m.at)}%"
                    title="{fmtTime(m.at)} {m.label}"
                  >
                    <span class="bg-accent size-size-indicator rounded-pill" aria-hidden="true"></span>
                    <span class="sr-only">{fmtTime(m.at)} {m.label}</span>
                  </li>
                {/each}
              </ol>
            {:else}
              <ol class="absolute inset-0" aria-label="{lane.label} 레인">
                <li class="text-body-sm text-fg-muted px-inset-sm flex h-full items-center">
                  없음 — {l.note ?? '소스 미연동'}
                </li>
              </ol>
            {/if}
            <div
              class="bg-danger absolute inset-y-0 w-px"
              style="left: {((cursor + win) / (2 * win)) * 100}%"
              aria-hidden="true"
            ></div>
          </div>
          {#if l.available && l.markers.length}
            <p class="text-label-sm text-fg-muted col-start-2" data-lane-markers>
              {#each l.markers as m, i (m.at + m.label)}{i ? ' · ' : ''}<span class="tabular-nums"
                  >t0{Math.round((Date.parse(m.at) - t0) / 1000) >= 0 ? '+' : ''}{Math.round(
                    (Date.parse(m.at) - t0) / 1000,
                  )}s</span
                >
                {m.label}{/each}
            </p>
          {/if}
        </div>
      {/each}
      <p class="text-label-sm text-fg-muted" data-ref="API-018">
        {ev.lanes.cpb.note ?? ''} · 레인 클릭으로 커서 이동
      </p>
    </section>

    <section class="gap-inline-lg grid md:grid-cols-2" aria-label="영상">
      {#each [ev.lanes.general, ev.lanes.ai] as l (l.source)}
        {@const cam = camOf(l)}
        <div class="gap-stack-xs flex flex-col" data-video-lane={l.source}>
          <div class="flex items-center justify-between">
            <span class="text-label-md"
              >{l.source === 'ai' ? 'AI CCTV · 붐 끝' : '일반 CCTV · 전방'} {cam ? `· ${cam.id}` : ''}</span
            >
            <span class="text-label-sm text-fg-muted tabular-nums">표시 시각 {fmtTime(cursorAt)}</span>
          </div>
          {#if cam}
            <VideoPlayer
              camera={cam}
              media={data.media}
              capture={data.capture}
              deviceLabel="{data.device?.unitNo}호기"
            />
          {:else}
            <EmptyState title="카메라 없음" />
          {/if}
        </div>
      {/each}
    </section>
  {/if}
</div>
