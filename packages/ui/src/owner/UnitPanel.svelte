<script lang="ts">
  // 호기 패널 — 호기·상태·배치 → 실시간 영상(앱 스니펫) → 설치·완료·임대기간(PeriodBar)·건설사 → 담당자 → 전압·단선·고장코드 → 관련 서류 → 상세 화면. 고객 V5 관제 요구의 호기 정보를 한 패널에.
  import type { Snippet } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import FileText from '@lucide/svelte/icons/file-text';
  import Video from '@lucide/svelte/icons/video';
  import VideoOff from '@lucide/svelte/icons/video-off';
  import UserRound from '@lucide/svelte/icons/user-round';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import {
    OWNER_CONNECTION,
    OWNER_DEPLOYMENT,
    OWNER_METRICS,
    ownerHref,
    type OwnerApp,
    type OwnerAiEvent,
    type OwnerCamera,
    type OwnerDevice,
    type OwnerSnapshot,
  } from '@boomeyes/domain';
  import { cx, OWNER_CONNECTION_TONE } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
  import AlertCard from './AlertCard.svelte';
  import Badge from '../primitives/Badge.svelte';
  import Banner from '../primitives/Banner.svelte';
  import Fold from '../primitives/Fold.svelte';
  import Button from '../primitives/Button.svelte';
  import ContactCard from '../primitives/ContactCard.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import KeyValueList from '../primitives/KeyValueList.svelte';
  import List from '../primitives/List.svelte';
  import PeriodBar from '../primitives/PeriodBar.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import { equipmentCondition, fleetReturn, ownerDate, ownerLink } from './core-helpers';
  let {
    data,
    app,
    url,
    device,
    capture = false,
    live,
    aiShot,
    cameraWall = false,
  }: {
    data: OwnerSnapshot;
    app: OwnerApp;
    url: URL;
    device: OwnerDevice;
    capture?: boolean;
    live?: Snippet<[OwnerCamera, string, boolean, boolean]>;
    /** AI 이벤트 스냅샷(탐지 상자 + 접근 주의 구역) — 앱이 넘긴다(ui는 video를 import하지 않는다) */
    aiShot?: Snippet<[OwnerAiEvent]>;
    /** 지도 자리에 카메라 벽이 있는 화면 — 패널은 영상을 그리지 않는다 */
    cameraWall?: boolean;
  } = $props();
  const condition = $derived(equipmentCondition(device));
  const camera = $derived(
    data.cameras.find((c) => c.deviceId === device.id && c.purpose === 'pour') ??
      data.cameras.find((c) => c.deviceId === device.id),
  );
  const driverDocs = $derived(data.driverDocs.filter((x) => x.driverId === device.driver?.id).length);
  const documents = $derived(data.documents.filter((d) => d.deviceId === device.id));
  const context = $derived({ device: device.id, return: url.pathname + url.search });
  // 지표 6(시안) — 값이 없으면 「미연동」으로 둔다. 옛 값을 정상처럼 보이지 않게(FR-034)
  const metrics = $derived(
    OWNER_METRICS.map((m) => ({
      label: m.label,
      value: device.telemetry[m.key] === null ? '미연동' : `${device.telemetry[m.key]} ${m.unit}`,
      muted: device.telemetry[m.key] === null,
    })),
  );
  const state = $derived([
    {
      label: '단선',
      value: device.harness === null ? '미연동' : device.harness === 'disconnected' ? '단선 감지' : '정상',
    },
    { label: '고장코드', value: device.errorCode ?? '없음', muted: !device.errorCode },
    { label: '마지막 수신', value: device.receivedAt ? fmtDateTime(device.receivedAt) : '수신 기록 없음' },
  ]);
  const aiEvents = $derived(data.aiEvents.filter((e) => e.deviceId === device.id));
  const alerts = $derived(data.alerts.filter((a) => a.deviceId === device.id));
  const parts = $derived(device.parts);
  const dueParts = $derived(parts.filter((x) => x.due).length);
  // 보유 장비 목록에서 들어왔을 때만 뒤로 링크 — 드릴다운으로 왔으면 크럼(전국›현장›호기)이 이미 길을 보인다.
  // `?return=`은 ownerHref가 옮겨 주지 않으므로(capture·state·scene·theme·sim만) 목록이 실어 준 것뿐이다.
  const listBack = $derived(url.searchParams.get('return') ? fleetReturn(url, app) : null);
</script>

<section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-unit-title" data-device={device.id}>
  {#if listBack}
    <a href={listBack} class="{ownerLink()} w-fit self-start" data-unit-back
      ><ChevronLeft class="size-size-icon-sm" aria-hidden="true" />보유 장비 목록으로</a
    >
  {/if}
  <div class="gap-stack-xs flex min-w-0 flex-col">
    <span class="text-code-sm text-fg-muted">{device.id} · {device.model}</span>
    <div class="gap-inline-sm flex flex-wrap items-center">
      <h2 id="owner-unit-title" class="text-heading-md" tabindex="-1" data-panel-heading="unit">{device.unit}호기</h2>
      <StatusPill size="sm" tone={condition.tone} label={condition.label}>
        {#snippet icon()}{#if condition.tone === 'neutral'}<Check
              class="size-size-icon-sm"
              aria-hidden="true"
            />{/if}{/snippet}
      </StatusPill>
      <Badge variant="outline">{OWNER_DEPLOYMENT[device.deployment]}</Badge>
    </div>
  </div>
  <!-- 오늘 운전자 — 소유주 소속이고 배정이 매일 바뀐다(FR-027 · 시안 «확정 2026-09-12») -->
  <p class="gap-inline-sm text-body-md flex min-w-0 flex-wrap items-center">
    <UserRound class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
    {#if device.driver}
      <span class="font-semibold">오늘 운전자 {device.driver.name}</span>
      <a class="text-accent-fg" href="tel:{device.driver.phone}">{device.driver.phone}</a>
    {:else}
      <span class="text-fg-muted">오늘 배정 없음</span>
    {/if}
  </p>
  {#if aiEvents.length > 0}
    <!-- AI 경고 — 사람 문제이므로 그 시각 배정 운전자를 함께 보인다(FR-028 · FR-027) -->
    <Banner tone="danger">
      {#snippet icon()}<TriangleAlert class="size-size-icon-md" aria-hidden="true" />{/snippet}
      {aiEvents[0]!.title} · {fmtDateTime(aiEvents[0]!.at)}{#if aiEvents[0]!.driver}
        · 운전자 {aiEvents[0]!.driver.name}{/if}
    </Banner>
  {/if}
  {#if cameraWall}
    <!-- 카메라는 지도 자리의 벽이 보인다 — 패널이 같은 영상을 한 번 더 그리지 않는다 -->
  {:else if live && camera?.available}
    {@render live(camera, `${device.unit}호기 ${camera.label} 실시간 예시`, capture, false)}
  {:else}
    <EmptyState
      title={device.connection === 'detached' ? '단말기 미장착' : '영상 미확보'}
      description={device.connection === 'detached'
        ? '보관 중인 장비에는 카메라 단말기가 없습니다.'
        : '수신이 재개되면 실시간 영상이 이곳에 표시됩니다.'}
    >
      {#snippet icon()}<IconTile><VideoOff class="size-size-icon-lg" /></IconTile>{/snippet}
    </EmptyState>
  {/if}
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-unit-contract-title">
    <h3 id="owner-unit-contract-title" class="text-label-md text-fg-muted">계약</h3>
    {#if device.contract}
      <PeriodBar
        start={device.contract.from}
        end={device.contract.to}
        now={data.at}
        label="임대 기간"
        format={ownerDate}
        markers={[{ at: device.contract.installed, label: '설치' }]}
      />
      <KeyValueList
        items={[
          { label: '설치일', value: ownerDate(device.contract.installed) },
          { label: '완료일', value: ownerDate(device.contract.to) },
          { label: '건설사', value: device.contract.company },
        ]}
      />
    {:else}
      <p class="text-body-md text-fg-muted">
        {device.deployment === 'stored' ? '진행 중인 계약 없음' : '계약 정보 미등록'}
      </p>
    {/if}
  </section>
  {#if device.contact}
    <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-unit-contact-title">
      <h3 id="owner-unit-contact-title" class="text-label-md text-fg-muted">
        {device.deployment === 'stored' ? '보관 담당자' : '현장 담당자'}
      </h3>
      <ContactCard name={device.contact.name} role={device.contact.job} phone={device.contact.phone} />
    </section>
  {/if}
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-unit-telemetry-title">
    <div class="gap-inline-sm flex flex-wrap items-center justify-between">
      <h3 id="owner-unit-telemetry-title" class="text-label-md text-fg-muted">장비 상태</h3>
      <StatusPill
        size="sm"
        tone={OWNER_CONNECTION_TONE[device.connection]}
        label={OWNER_CONNECTION[device.connection]}
      />
    </div>
    <KeyValueList items={metrics} />
    <KeyValueList items={state} />
    <!-- 수신이 끊긴 호기의 지표는 위에서 전부 「미연동」이다(옛 값을 지금 값처럼 보이지 않게 · FR-034).
         그래서 마지막으로 받은 전압은 여기서 「마지막 수신값」이라고 이름을 붙여 따로 보인다 —
         이름 없이 숫자만 두면 지금 값으로 읽히고, 아예 없애면 오프라인에서 볼 것이 사라진다. -->
    {#if device.connection !== 'current'}
      <p class={cx('text-body-sm', device.connection === 'stale' ? 'text-warning-fg' : 'text-fg-muted')}>
        현재 상태를 확인할 수 없습니다.
      </p>
      {#if device.voltage !== null}
        <div class="gap-stack-xs flex flex-col">
          <span class="text-label-md text-fg-muted">공급 전압 · 마지막 수신값</span>
          <span class={cx('text-heading-sm tabular-nums', device.fault ? 'text-danger-fg' : 'text-warning-fg')}
            >{device.voltage}<span class="text-body-sm text-fg-muted ml-inline-xs">V</span></span
          >
        </div>
      {/if}
    {/if}
    {#if device.fault}<p class={cx('text-body-sm', 'text-danger-fg')}>{device.fault}</p>{/if}
  </section>
  <!-- 소모품·서류는 접어 둔다 — 지표와 경고가 먼저 읽혀야 한다(시안의 호기 화면) -->
  <Fold title="마모·교체 부품" meta={dueParts ? `교체 대상 ${dueParts}` : `${parts.length}종`}>
    {#if parts.length > 0}
      <KeyValueList
        items={parts.map((x) => ({
          label: x.name,
          value: x.kind === 'wear' ? `마모 ${x.value}% / ${x.limit}%` : `교체까지 ${x.value}일`,
          muted: !x.due,
        }))}
      />
    {:else}
      <p class="text-body-sm text-fg-muted">등록된 부품 없음</p>
    {/if}
  </Fold>
  <!-- 이상·점검 이력 — 그 호기에 붙은 알림 전부. 옛 「호기 상세」에만 있던 것을 이 화면으로 옮겼다
       (호기 화면은 하나다 · 시안 «확정 2026-09-12»). 접어 두는 것은 부품·AI 이벤트와 같은 규칙이다. -->
  {#if alerts.length > 0}
    <Fold title="이상·점검 이력" meta={`${alerts.length}건`}>
      <List items={alerts} key={(a) => a.id} label="{device.unit}호기 알림 이력" variant="plain">
        {#snippet item(alert)}
          <AlertCard
            {alert}
            now={data.at}
            data-alert={alert.id}
            href={ownerHref(url, 'alerts', app, { ...context, alert: alert.id })}
          />
        {/snippet}
      </List>
    </Fold>
  {/if}
  {#if aiEvents.length > 0}
    <Fold title="AI 이벤트" meta={`${aiEvents.length}건`}>
      <List items={aiEvents} key={(e) => e.id} label="AI 이벤트" variant="plain">
        {#snippet item(event)}
          <div class="gap-stack-xs py-inset-xs flex min-w-0 flex-col">
            <span class="text-body-md font-semibold">{event.title}</span>
            <span class="text-body-sm text-fg-muted"
              >{fmtDateTime(event.at)}{#if event.driver}
                · 운전자 {event.driver.name}{/if}</span
            >
            <span class="text-body-sm">{event.detail}</span>
            <!-- 판단 근거 — 그 순간의 화면에 탐지 상자와 접근 주의 구역을 얹는다(FR-028) -->
            {@render aiShot?.(event)}
          </div>
        {/snippet}
      </List>
    </Fold>
  {/if}
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-unit-docs-title">
    <h3 id="owner-unit-docs-title" class="text-label-md text-fg-muted">차량 서류</h3>
    {#if documents.length > 0}
      <List items={documents} key={(d) => d.id} label="관련 서류" variant="plain">
        {#snippet item(doc)}
          <a
            href={ownerHref(url, 'documents', app, { ...context, doc: doc.id })}
            class="gap-inline-sm py-inset-xs text-body-md hover:text-accent-fg min-h-size-touch-min flex items-center"
            ><FileText class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" /><span
              class="min-w-0 break-words">{doc.title}</span
            ></a
          >
        {/snippet}
      </List>
    {:else}
      <p class="text-body-sm text-fg-muted">등록된 서류 없음</p>
    {/if}
    <!-- 서류는 두 갈래다 — 차량은 호기에, 자격은 사람에 속한다(시안 «확정 2026-09-12» · FR-027).
         호기 화면에 운전자 자격증을 넣은 것이 잘못이었고 운전자 쪽으로 옮겼다. -->
    {#if device.driver}
      <a
        href={ownerHref(url, 'driver-docs', app)}
        class="gap-inline-sm py-inset-xs text-body-md hover:text-accent-fg min-h-size-touch-min flex items-center"
        data-driver-docs-link
        ><UserRound class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" /><span class="min-w-0"
          >{device.driver.name} 운전자 서류 {driverDocs}종</span
        ></a
      >
    {/if}
  </section>
  <!-- 저장 영상은 카메라 벽(실시간)과 다른 화면이다 — 가동일을 골라 되감아 본다 -->
  <Button variant="outline" tone="neutral" href={ownerHref(url, 'video', app, context, device.id)}>
    <Video class="size-size-icon-sm" aria-hidden="true" />현장 영상
  </Button>
</section>
