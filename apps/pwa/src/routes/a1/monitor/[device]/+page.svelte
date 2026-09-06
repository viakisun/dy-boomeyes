<script lang="ts">
  // A1-05 장비 상세 (specs/video-basics AC-3) — 상단 탭 4(상태 · 서류 · 영상 · 부품): 텔레메트리 · 서류 완비율/만료 · 저장 영상(프로파일 소스 탭)+카메라 · 마모·교체 부품
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Doc } from '@boomeyes/domain';
  import {
    Badge,
    DOC_TONE,
    EQUIPMENT_TONE,
    ERROR_CODE_LABEL,
    EmptyState,
    StatusPill,
    Tabs,
    TelemetryGauge,
    TelemetryStrip,
    dueLabel,
    fmtDateTime,
  } from '@boomeyes/ui';
  import { CameraTile, HealthBadge, SOURCE_LABEL } from '@boomeyes/video';
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
  const go = (key: string, value: string) => {
    const u = new URL(location.href);
    u.searchParams.set(key, value);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A1-05']}>
  <a href={resolve('/a1/monitor' as '/')} class="text-label-md text-accent-fg">‹ 현장 모니터</a>
  <header class="gap-stack-xs flex flex-col">
    <div class="flex items-center justify-between">
      <h2 class="text-heading-lg">{d.id} · {d.unitNo}호기</h2>
      <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} signal />
    </div>
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
    <TelemetryStrip telemetry={d.telemetry} />
    <dl class="gap-x-inline-md gap-y-stack-xs text-body-sm grid grid-cols-[auto_1fr]" aria-label="CAN · IO">
      <dt class="text-fg-muted">CAN</dt>
      <dd>pump_status {d.state === 'fault' ? 'abnormal' : 'normal'} · 붐 각도 {d.telemetry.boomAngle}°</dd>
      <dt class="text-fg-muted">IO</dt>
      <dd>DI1 입력 1 · 정상</dd>
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
                <li class="px-inset-md py-inset-xs flex items-center justify-between">
                  <span class="tabular-nums">{fmtDateTime(r.at)} ~ +{Math.round(r.durationSec / 60)}분</span>
                  <span class="text-fg-muted"
                    >{SOURCE_LABEL[r.source]}{data.flags.sdRecall && r.source === 'sd' ? ' · 구간 회수 가능' : ''}</span
                  >
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
            <CameraTile camera={c} deviceLabel="{d.unitNo}호기" compact status={false} />
            <HealthBadge camera={c} />
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
