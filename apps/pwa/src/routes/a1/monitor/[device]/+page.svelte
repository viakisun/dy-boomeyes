<script lang="ts">
  // A1-05 장비 상세 (specs/video-basics AC-3) — 상단 탭 4(상태 · 서류 · 영상 · 부품): 텔레메트리 · 서류 완비율/만료 · 저장 영상(프로파일 소스 탭)+카메라 · 마모·교체 부품
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, todayM3, type Doc, type Recording } from '@boomeyes/domain';
  import {
    Badge,
    DOC_TONE,
    EQUIPMENT_TONE,
    ERROR_CODE_LABEL,
    EmptyState,
    StatusPill,
    Tabs,
    BarChart,
    TelemetryGauge,
    fmtHour,
    TelemetryStrip,
    dueLabel,
    fmtDateTime,
    fmtDuration,
    Button,
  } from '@boomeyes/ui';
  import { CameraTile, HealthBadge, MOUNT_LABEL, SOURCE_LABEL } from '@boomeyes/video';
  import CameraSheet from '$lib/CameraSheet.svelte';
  import ReportSheet from '$lib/ReportSheet.svelte';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const d = $derived(data.device);
  const EQUIP_LABEL = { normal: '정상', caution: '주의', fault: '고장', offline: '두절', maintenance: '정비' } as const;
  const DOC_LABEL = {
    valid: '유효',
    expiring: '만료 임박',
    submitted: '제출',
    review: '검토 중',
    approved: '승인',
    rejected: '반려',
  } as const;
  const complete = $derived(data.completeness?.rate ?? 0); // FR-016 완비율은 API(docCompleteness)
  const expiring = $derived([...data.deviceDocs, ...data.driverDocs].filter((x) => x.state === 'expiring'));
  const now = $derived(data.clock.now());
  const tabs = $derived(data.flags.sources.map((s) => ({ id: s, label: SOURCE_LABEL[s] })));
  const general = $derived(data.cameras.find((c) => c.kind === 'general') ?? data.cameras[0]);
  const docRow = (x: Doc) =>
    `${x.subject} · ${DOC_LABEL[x.state]}${x.expiresAt ? ` · ${dueLabel(x.expiresAt, now).label}` : ''}`;
  const TOP_TABS = [
    { id: 'status', label: '상태' },
    { id: 'docs', label: '서류' },
    { id: 'video', label: '영상' },
    { id: 'parts', label: '부품' },
  ];
  // 탭·소스 전환은 다른 쿼리(?state= ?capture=)를 유지한다 — mock db 캐시 키(QA §3)
  let report = $state(false); // 현장 신고 시트(FR-038)
  const go = (key: string, value: string) => {
    const u = new URL(location.href);
    u.searchParams.set(key, value);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  // 카메라 영상 시트(?cam=) — replaceState를 쓰지 않는다: 뒤로가기로 닫혀야 한다
  const withCam = (id: string | null) => {
    const u = new URL(location.href);
    if (id) u.searchParams.set('cam', id);
    else u.searchParams.delete('cam');
    return (u.pathname + u.search) as '/';
  };
  const openCam = (id: string) => goto(resolve(withCam(id)), { keepFocus: true, noScroll: true });
  const closeCam = () => goto(resolve(withCam(null)), { keepFocus: true, noScroll: true });
  // data.cameras는 loader가 이미 AX-1로 걸렀다 — 그 안에 있으면 열 수 있다
  const sheetCam = $derived(data.cam ? (data.cameras.find((c) => c.id === data.cam) ?? null) : null);
  // 저장 영상 재생(FR-005) — 목록 행의 재생이 카메라 시트를 열고 대체 클립을 넘긴다. 시트를 닫으면 해제
  let playing = $state<Recording | null>(null);
  $effect(() => {
    if (!sheetCam) playing = null;
  });
  const playRec = (r: Recording) => {
    playing = r;
    if (general) openCam(general.id);
  };
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A1-05']}>
  <a href={resolve('/a1/monitor' as '/')} class="text-label-md text-accent-fg">‹ 현장 모니터</a>
  <header class="gap-stack-xs flex flex-col">
    <div class="flex items-center justify-between">
      <h2 class="text-heading-lg">{d.id} · {d.unitNo}호기</h2>
      <span class="gap-inline-sm flex items-center">
        <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} />
        <Button size="sm" variant="outline" tone="neutral" onclick={() => (report = true)}>신고</Button>
      </span>
    </div>
    <ReportSheet
      bind:open={report}
      devices={[d]}
      deviceId={d.id}
      cameras={data.cameras}
      api={data.api}
      clock={data.clock}
      by={session.user?.userId ?? 'safety01'}
    />
    <span class="text-body-sm text-fg-muted"
      >{data.site?.name ?? d.siteId} · 마지막 수신 {fmtDateTime(d.telemetry.at)}{data.driver
        ? ` · 운전자 ${data.driver.display}`
        : ''}</span
    >
    {#if d.telemetry.errorCode}<span class="text-body-sm text-danger-fg"
        >{d.telemetry.errorCode} — {ERROR_CODE_LABEL[d.telemetry.errorCode] ?? ''}</span
      >{/if}
  </header>
  <Tabs tabs={TOP_TABS} value={data.tab} onchange={(id) => go('tab', id)} />

  {#if data.tab === 'status'}
    <TelemetryStrip telemetry={d.telemetry} {now} />
    <dl class="gap-x-inline-md gap-y-stack-xs text-body-sm grid grid-cols-[auto_1fr]" aria-label="CAN · IO">
      <dt class="text-fg-muted">CAN</dt>
      <dd>펌프 상태 {d.state === 'fault' ? '이상' : '정상'} · 붐 각도 {d.telemetry.boomAngle}°</dd>
      <dt class="text-fg-muted">IO</dt>
      <dd>입력 신호 정상</dd>
    </dl>
  {:else if data.tab === 'parts'}
    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-md flex flex-col border"
      aria-label="마모·교체 부품"
    >
      <h3 class="text-heading-sm">마모·교체 부품 도달률</h3>
      <TelemetryGauge label="수송관" value={d.telemetry.pipeRatio} />
      <TelemetryGauge label="필터" value={d.telemetry.filterRatio} />
    </section>
    <!-- 타설량(FR-039 · specs/pour-metrics AC-2·AC-5) — 24버킷 전부 · 오늘은 todayM3(KST 자정 이후) -->
    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-md flex flex-col border"
      aria-label="타설량"
    >
      <h3 class="text-heading-sm">타설량</h3>
      {#if d.pour}
        {@const p = d.pour}
        <dl class="gap-stack-xs text-body-sm grid grid-cols-2">
          <dt class="text-fg-muted">누적</dt>
          <dd class="tabular-nums">{p.cumulativeM3.toLocaleString('ko-KR')} m³</dd>
          <dt class="text-fg-muted">24시간</dt>
          <dd class="tabular-nums">{p.totalM3} m³</dd>
          <dt class="text-fg-muted">오늘</dt>
          <dd class="tabular-nums">{todayM3(p.buckets, data.clock.now())} m³</dd>
          <dt class="text-fg-muted">가동률</dt>
          <dd class="tabular-nums">{Math.round(p.utilization * 100)}%</dd>
        </dl>
        <BarChart
          label="타설량 24h"
          unit=" m³"
          bars={p.buckets.map((b) => ({ key: b.at, label: fmtHour(b.at), value: b.m3 }))}
          markKey={p.buckets.at(-1)?.at}
          hint="작업 시간대 기준"
        />
        <span class="text-body-sm text-fg-muted" data-ref="DISC-055"
          >산출 기준안 D{p.basis.pipeDiaMm} {p.basis.areaM2} m² · L {p.basis.sensorGapM} m · 확정 전</span
        >
      {:else}
        <span class="text-body-sm text-fg-muted" data-ref="DISC-055">타설량 미연동</span>
      {/if}
    </section>
    <a href={resolve(`/a1/parts/inspect` as '/')} class="text-body-md text-accent-fg" data-link="parts"
      >마모·교체 부품 점검 입력 ›</a
    >
  {:else if data.tab === 'docs'}
    <section
      class="rounded-card border-border bg-surface p-inset-md gap-stack-sm flex flex-col border"
      aria-label="서류"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-heading-sm">서류</h3>
        <Badge tone={complete === 100 ? 'success' : 'warning'}>완비율 {complete}%</Badge>
      </div>
      <ul class="gap-stack-xs text-body-sm flex flex-col">
        {#each data.deviceDocs as x (x.id)}
          <li class="flex items-center justify-between">
            <span>{docRow(x)}</span><StatusPill tone={DOC_TONE[x.state]} label={DOC_LABEL[x.state]} size="sm" />
          </li>
        {/each}
        {#each data.driverDocs as x (x.id)}
          <li class="flex items-center justify-between">
            <span>{docRow(x)} <span class="text-fg-muted">(운전자)</span></span><StatusPill
              tone={DOC_TONE[x.state]}
              label={DOC_LABEL[x.state]}
              size="sm"
            />
          </li>
        {/each}
      </ul>
      {#if expiring.length}<Badge tone="warning" variant="outline"
          >만료 임박 {expiring.length}건 — {expiring
            .map((x) => dueLabel(x.expiresAt ?? '', now).label)
            .join(' · ')}</Badge
        >{/if}
    </section>
  {:else}
    <section class="gap-stack-sm flex flex-col" aria-label="저장 영상">
      <h3 class="text-heading-sm">저장 영상</h3>
      <Tabs variant="pill" size="sm" {tabs} value={data.source} onchange={(id) => go('source', id)} />
      {#if general}
        {#await data.media.recordings(general.id, data.source as 'server')}
          <span class="text-body-sm text-fg-muted">목록 불러오는 중</span>
        {:then list}
          {#if list.length}
            <ul
              class="rounded-card border-border bg-surface divide-border-subtle text-body-sm divide-y border"
              aria-label="저장 영상 목록"
            >
              {#each list as r (r.id)}
                <li class="px-inset-md py-inset-xs gap-inline-sm flex items-center justify-between">
                  <span class="tabular-nums">{fmtDateTime(r.at)} · {fmtDuration(r.durationSec)}</span>
                  <span class="text-fg-muted flex-1">{SOURCE_LABEL[r.source]}{r.url ? '' : ' · 구간 회수 필요'}</span>
                  <Button size="sm" variant="link" disabled={!r.url} onclick={() => playRec(r)}>재생</Button>
                </li>
              {/each}
            </ul>
          {:else}
            <EmptyState title="저장 영상이 없습니다" />
          {/if}
        {/await}
        {#if data.flags.nvrTimeline}<span class="text-label-sm text-fg-muted">NVR 타임라인 — 준비 중</span>{/if}
      {/if}
    </section>

    <section class="gap-stack-sm flex flex-col" aria-label="카메라">
      <h3 class="text-heading-sm">카메라 {data.cameras.length}</h3>
      <div class="gap-inline-sm grid grid-cols-2">
        {#each data.cameras as c (c.id)}
          <div class="gap-stack-xs flex flex-col" data-camera={c.id}>
            <CameraTile camera={c} deviceLabel="{d.unitNo}호기" compact status={false} onclick={openCam} />
            <HealthBadge camera={c} />
            <span class="text-label-sm text-fg-muted" data-mount={c.mount}
              >{c.mount ? MOUNT_LABEL[c.mount] : '장착 위치 미등록'}</span
            >
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <CameraSheet
    camera={sheetCam}
    siblings={data.cameras}
    device={d}
    media={data.media}
    capture={data.capture}
    snapshotEveryMs={data.flags.snapshotEveryMs}
    clip={playing?.url ? { url: playing.url, poster: playing.poster, label: fmtDateTime(playing.at) } : undefined}
    onlive={() => (playing = null)}
    onopen={openCam}
    onclose={closeCam}
  />
</div>
