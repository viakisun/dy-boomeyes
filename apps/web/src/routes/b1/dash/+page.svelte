<script lang="ts">
  // B1-02 관제 대시보드 (specs/control-dashboard AC-1~5) · B1-02M 카메라 모달(?cam=)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { profileFlags, type Alert, type Camera, type Device, type StorageSource } from '@boomeyes/domain';
  import { onMount } from 'svelte';
  import { MapView } from '@boomeyes/map';
  import {
    Badge,
    Button,
    Dialog,
    EQUIPMENT_TONE,
    SEVERITY_TONE,
    Stat,
    StatusPill,
    Tabs,
    cx,
    toast,
  } from '@boomeyes/ui';
  import { CameraTile, SOURCE_LABEL, VideoPlayer } from '@boomeyes/video';
  let { data } = $props();
  const LABEL = { normal: '정상', caution: '주의', fault: '고장', offline: '두절', maintenance: '정비' } as const;
  const ORDER = { fault: 0, offline: 1, caution: 2, maintenance: 3, normal: 4 } as const;
  let selectedId = $state<string | null>(data.devices.find((d) => d.state === 'fault')?.id ?? null);
  const selected = $derived(data.devices.find((d) => d.id === selectedId) ?? null);
  const site = (d: Device) => data.sites.find((s) => s.id === d.siteId);
  const abnormal = $derived(
    [...data.devices].filter((d) => d.state !== 'normal').sort((a, b) => ORDER[a.state] - ORDER[b.state]),
  );
  const markers = $derived(
    data.devices.map((d) => ({
      id: d.id,
      lat: d.lat,
      lng: d.lng,
      state: d.state,
      label: `${d.unitNo}호기`,
      selected: d.id === selectedId,
    })),
  );
  // 현장 프로파일 AX-1: 1채널(P-LITE)이면 AI 채널을 숨긴다 (video-basics design · profileFlags.channels)
  const visible = (c: Camera) => {
    const d = data.devices.find((x) => x.id === c.deviceId);
    const s = d ? site(d) : undefined;
    return profileFlags(s?.videoProfile ?? 'P-SD').channels === 2 || c.kind === 'general';
  };
  const wallCams = $derived(data.cameras.filter((c) => (!selectedId || c.deviceId === selectedId) && visible(c)));
  // ?cam= 딥링크도 현장 프로파일(AX-1) 밖 채널은 열지 않는다
  const modalCam = $derived(data.cam ? (data.cameras.find((c) => c.id === data.cam && visible(c)) ?? null) : null);
  const modalDevice = $derived(modalCam ? data.devices.find((d) => d.id === modalCam.deviceId) : null);
  let source = $state('server');
  // 모달: 현장 프로파일 → 저장 소스 탭 · 스냅샷 주기 (video-basics AC-4) · AI 이벤트 bbox (피드의 최신 이벤트)
  const modalSite = $derived(modalDevice ? data.sites.find((s) => s.id === modalDevice.siteId) : undefined);
  const modalFlags = $derived(profileFlags(modalSite?.videoProfile ?? 'P-SD'));
  const modalSource = $derived<StorageSource>(
    modalFlags.sources.includes(source as StorageSource) ? (source as StorageSource) : modalFlags.sources[0]!,
  );
  // 실시간 알림(mock realtime, AC-3) — 도착분을 피드 상단에 붙이고 토스트
  let live = $state<Alert[]>([]);
  const feed = $derived([...live, ...data.alerts]);
  const modalBoxes = $derived(
    modalCam
      ? feed
          .filter((a) => a.cameraId === modalCam.id && a.bbox)
          .slice(0, 1)
          .map((a) => ({ ...a.bbox!, label: '사람', score: 0.91 }))
      : [],
  );
  onMount(() =>
    data.realtime.subscribe((e) => {
      if (e.type !== 'alert.raised') return;
      live = [e.alert, ...live];
      toast(e.alert.message);
    }),
  );
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  const openCam = (id: string) => goto(resolve(`/b1/dash?cam=${id}` as '/'), { keepFocus: true, noScroll: true });
  const closeCam = () => goto(resolve('/b1/dash' as '/'), { keepFocus: true, noScroll: true });
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={modalCam ? 'B1-02M' : 'B1-02'}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <header class="gap-inline-md flex items-end justify-between">
      <div>
        <h1 class="text-heading-xl">관제 대시보드</h1>
        <p class="text-body-sm text-fg-muted">
          전국 CPB {data.kpis.total}대 · 실시간(mock) · {fmt(data.clock.iso())}
        </p>
      </div>
      <Button variant="outline" tone="neutral" size="sm" onclick={() => goto(resolve('/b1/showcase' as '/'))}
        >쇼케이스</Button
      >
    </header>

    <section class="gap-inline-md grid grid-cols-2 md:grid-cols-4" aria-label="KPI">
      <Stat label="가동" value={data.kpis.normal} unit="대" tone="success" hint="정상 텔레메트리 수신" />
      <Stat label="주의" value={data.kpis.caution} unit="대" tone="warning" hint="임계 접근(수송관·필터·전압)" />
      <Stat
        label="고장·E-코드"
        value={data.kpis.fault}
        unit="대"
        tone="danger"
        hint="업무 {data.kpis.openCases}건 미완료"
      />
      <Stat
        label="통신 두절"
        value={data.kpis.offline}
        unit="대"
        tone="neutral"
        hint="에스컬레이션 {data.kpis.escalated}건"
      />
    </section>

    <section class="gap-inline-lg grid grid-cols-1 lg:grid-cols-[3fr_2fr]">
      <div class="gap-stack-sm min-h-layout-panel-height flex flex-col">
        <h2 class="text-heading-sm">위치 · 상태</h2>
        <div class="min-h-layout-map-min flex-1"><MapView {markers} onselect={(id) => (selectedId = id)} /></div>
        <div class="gap-inline-sm text-label-sm text-fg-muted flex flex-wrap">
          {#each Object.entries(LABEL) as [st, lb] (st)}<StatusPill
              tone={EQUIPMENT_TONE[st as Device['state']]}
              label={lb}
              size="sm"
            />{/each}
        </div>
      </div>
      <div class="gap-stack-sm flex flex-col">
        <h2 class="text-heading-sm">
          알림 피드 <Badge tone="danger" count={feed.filter((a) => !a.acked).length} />
        </h2>
        <ul
          class="rounded-card border-border bg-surface p-inset-xs max-h-layout-panel-height gap-stack-xs flex flex-col overflow-y-auto border"
          aria-label="알림"
        >
          {#each feed as a (a.id)}
            <li>
              <a
                href={a.caseId ? resolve(`/b1/inbox?case=${a.caseId}` as '/') : resolve('/b1/dash' as '/')}
                class={cx(
                  'gap-inline-sm rounded-control px-inset-sm py-inset-xs hover:bg-ui-hover flex items-start',
                  !a.acked && 'bg-surface-sunken',
                )}
              >
                <StatusPill
                  tone={SEVERITY_TONE[a.severity]}
                  label={a.severity === 'critical' ? '긴급' : a.severity === 'warning' ? '경고' : '정보'}
                  size="sm"
                />
                <span class="text-body-sm text-fg flex-1">{a.message}</span>
                <span class="text-label-sm text-fg-muted tabular-nums">{fmt(a.at)}</span>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <section class="gap-stack-sm flex flex-col">
      <h2 class="text-heading-sm">이상 장비 <span class="text-body-sm text-fg-muted">{abnormal.length}대</span></h2>
      <div class="rounded-card border-border bg-surface overflow-x-auto border">
        <table class="text-body-md w-full">
          <thead class="text-label-md text-fg-muted"
            ><tr class="border-border-subtle border-b"
              >{#each ['호기', '상태', '현장', '전압', 'LTE', '고장코드', '수송관', '마지막 수신'] as h (h)}<th
                  class="h-size-row-dense px-inset-md text-left font-medium">{h}</th
                >{/each}</tr
            ></thead
          >
          <tbody>
            {#each abnormal as d (d.id)}
              <tr
                class={cx(
                  'h-size-row-default border-border-subtle hover:bg-ui cursor-pointer border-b',
                  d.id === selectedId && 'bg-selected',
                )}
                onclick={() => (selectedId = d.id)}
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && (selectedId = d.id)}
              >
                <td class="px-inset-md font-mono">{d.id}</td>
                <td class="px-inset-md"
                  ><StatusPill tone={EQUIPMENT_TONE[d.state]} label={LABEL[d.state]} size="sm" /></td
                >
                <td class="px-inset-md">{site(d)?.name}</td>
                <td
                  class={cx(
                    'px-inset-md text-right tabular-nums',
                    d.telemetry.voltageStatus === 'abnormal' && 'text-danger-fg font-semibold',
                  )}>{d.telemetry.voltage}V</td
                >
                <td class="px-inset-md">{d.telemetry.lte}</td>
                <td class="px-inset-md text-danger-fg font-mono">{d.telemetry.errorCode ?? '—'}</td>
                <td
                  class={cx(
                    'px-inset-md text-right tabular-nums',
                    d.telemetry.pipeRatio >= 0.95 && 'text-warning-fg font-semibold',
                  )}>{Math.round(d.telemetry.pipeRatio * 100)}%</td
                >
                <td class="px-inset-md text-fg-muted tabular-nums">{fmt(d.telemetry.at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    <section class="gap-stack-sm flex flex-col">
      <h2 class="text-heading-sm">
        카메라 월 {#if selected}<span class="text-body-sm text-fg-muted"
            >— {selected.unitNo}호기 {wallCams.length}채널</span
          >{/if}
      </h2>
      <div
        class="gap-inline-md rounded-card bg-media-bg p-inset-md grid grid-cols-2 md:grid-cols-4"
        data-theme="dark"
        data-wall
      >
        {#each wallCams as c (c.id)}<CameraTile
            camera={c}
            deviceLabel="{data.devices.find((d) => d.id === c.deviceId)?.unitNo}호기"
            onclick={openCam}
          />{/each}
      </div>
    </section>
  </div>

  {#if selected}
    <aside
      class="rounded-card border-border bg-surface p-inset-lg gap-stack-md sticky top-0 hidden h-fit flex-col border xl:flex"
      aria-label="장비 상세"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-heading-md">{selected.id} · {selected.unitNo}호기</h3>
        <StatusPill tone={EQUIPMENT_TONE[selected.state]} label={LABEL[selected.state]} />
      </div>
      <dl class="gap-stack-xs text-body-sm grid grid-cols-2">
        <dt class="text-fg-muted">현장</dt>
        <dd>{site(selected)?.name}</dd>
        <dt class="text-fg-muted">전압</dt>
        <dd class={cx('tabular-nums', selected.telemetry.voltageStatus === 'abnormal' && 'text-danger-fg')}>
          {selected.telemetry.voltage}V · {selected.telemetry.voltageStatus === 'abnormal' ? '이상' : '정상'}
        </dd>
        <dt class="text-fg-muted">단선</dt>
        <dd>{selected.telemetry.harness === 'ok' ? '정상' : '단선'}</dd>
        <dt class="text-fg-muted">LTE · GPS</dt>
        <dd>{selected.telemetry.lte} · {selected.telemetry.gpsFix ? 'fix' : 'no fix'}</dd>
        <dt class="text-fg-muted">수송관 · 필터</dt>
        <dd class="tabular-nums">
          {Math.round(selected.telemetry.pipeRatio * 100)}% · {Math.round(selected.telemetry.filterRatio * 100)}%
        </dd>
        <dt class="text-fg-muted">고장코드</dt>
        <dd class="font-mono">{selected.telemetry.errorCode ?? '—'}</dd>
      </dl>
      {#if data.cases.find((c) => c.deviceId === selected.id && c.state !== 'done')}
        {@const c = data.cases.find((x) => x.deviceId === selected.id && x.state !== 'done')}
        <div class="rounded-card border-border bg-surface-sunken p-inset-md text-body-sm border">
          <span class="text-label-md text-fg-muted">진행 중 업무</span>
          <p class="mt-stack-xs font-medium">{c?.id} {c?.title}</p>
        </div>
      {/if}
      <Button variant="outline" tone="neutral" size="sm" onclick={() => goto(resolve('/b1/inbox' as '/'))}
        >수신함으로</Button
      >
    </aside>
  {/if}
</div>

<Dialog
  open={!!modalCam}
  title={modalCam
    ? `${modalDevice?.unitNo}호기 · ${modalCam.kind === 'ai' ? 'AI 카메라(붐 끝)' : '일반 카메라(전방)'}`
    : ''}
  size="lg"
  capture
  onclose={closeCam}
>
  {#if modalCam}
    <div class="gap-stack-md flex flex-col" data-scr="B1-02M">
      <div class="gap-inline-sm flex flex-wrap items-center">
        {#each data.cameras.filter((c) => c.deviceId === modalCam.deviceId && visible(c)) as c (c.id)}
          <Button
            size="sm"
            variant={c.id === modalCam.id ? 'solid' : 'outline'}
            tone={c.id === modalCam.id ? 'accent' : 'neutral'}
            onclick={() => openCam(c.id)}>{c.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방'}</Button
          >
        {/each}
        <span class="gap-inline-xs ml-auto flex flex-wrap">
          <Badge tone="info">라이브 {modalCam.live}</Badge>
          <Badge tone="danger" variant={modalCam.state === 'recording' ? 'solid' : 'subtle'}
            >● REC {SOURCE_LABEL[modalCam.recording === 'edge' ? 'server' : modalCam.recording]} · {modalCam.retentionDays}일</Badge
          >
          <Badge tone="neutral">이벤트 {modalCam.ingest}</Badge>
        </span>
      </div>
      <VideoPlayer
        camera={modalCam}
        media={data.media}
        capture={data.capture}
        snapshotEveryMs={modalFlags.snapshotEveryMs}
        boxes={modalBoxes}
        deviceLabel="{modalDevice?.unitNo}호기"
      />
      <Tabs
        tabs={modalFlags.sources.map((s) => ({ id: s, label: `${SOURCE_LABEL[s]} 녹화` }))}
        value={modalSource}
        onchange={(id) => (source = id)}
        size="sm"
      />
      {#await data.media.recordings(modalCam.id, modalSource)}
        <span class="text-body-sm text-fg-muted">목록 불러오는 중</span>
      {:then list}
        <ul
          class="divide-border-subtle rounded-card border-border text-body-sm divide-y border"
          aria-label="저장 영상 목록"
        >
          {#each list as r (r.id)}
            <li class="px-inset-md py-inset-xs gap-inline-sm flex items-center justify-between">
              <span class="font-mono tabular-nums">{fmt(r.at)} ~ +{Math.round(r.durationSec / 60)}분</span>
              <span class="text-fg-muted flex-1"
                >{SOURCE_LABEL[r.source]}{modalFlags.sdRecall && r.source === 'sd' ? ' · 구간 회수' : ''}</span
              >
              <Button size="sm" variant="link">재생</Button>
            </li>
          {/each}
        </ul>
      {/await}
      {#if modalFlags.sdRecall && modalSource === 'sd'}
        <Button size="sm" variant="outline" tone="neutral">SD 구간 회수 요청</Button>
      {/if}
      {#if modalFlags.nvrTimeline}<span class="text-label-sm text-fg-muted">NVR 타임라인 — W4</span>{/if}
    </div>
  {/if}
  {#snippet footer()}<Button variant="ghost" tone="neutral" onclick={closeCam}>닫기 (Esc)</Button>{/snippet}
</Dialog>
