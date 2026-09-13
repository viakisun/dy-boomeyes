<script lang="ts">
  // 호기 패널 — 호기·상태·배치 → 실시간 영상(앱 스니펫) → 설치·완료·임대기간(PeriodBar)·건설사 → 담당자 → 전압·단선·고장코드 → 관련 서류 → 상세 화면. 고객 V5 관제 요구의 호기 정보를 한 패널에.
  import type { Snippet } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import FileText from '@lucide/svelte/icons/file-text';
  import VideoOff from '@lucide/svelte/icons/video-off';
  import UserRound from '@lucide/svelte/icons/user-round';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import {
    OWNER_CONNECTION,
    OWNER_DEPLOYMENT,
    OWNER_METRICS,
    ownerHref,
    type OwnerApp,
    type OwnerCamera,
    type OwnerDevice,
    type OwnerSnapshot,
  } from '@boomeyes/domain';
  import { cx, OWNER_CONNECTION_TONE } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
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
  import { equipmentCondition, ownerDate } from './core-helpers';
  let {
    data,
    app,
    url,
    device,
    capture = false,
    live,
  }: {
    data: OwnerSnapshot;
    app: OwnerApp;
    url: URL;
    device: OwnerDevice;
    capture?: boolean;
    live?: Snippet<[OwnerCamera, string, boolean]>;
  } = $props();
  const condition = $derived(equipmentCondition(device));
  const camera = $derived(
    data.cameras.find((c) => c.deviceId === device.id && c.purpose === 'pour') ??
      data.cameras.find((c) => c.deviceId === device.id),
  );
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
  const parts = $derived(device.parts);
  const dueParts = $derived(parts.filter((x) => x.due).length);
</script>

<section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-unit-title" data-device={device.id}>
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
  {#if live && camera?.available}
    {@render live(camera, `${device.unit}호기 ${camera.label} 실시간 예시`, capture)}
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
  {#if aiEvents.length > 0}
    <Fold title="AI 이벤트" meta={`${aiEvents.length}건`}>
      <List items={aiEvents} key={(e) => e.id} label="AI 이벤트" variant="plain">
        {#snippet item(event)}
          <p class="gap-stack-xs py-inset-xs flex min-w-0 flex-col">
            <span class="text-body-md font-semibold">{event.title}</span>
            <span class="text-body-sm text-fg-muted"
              >{fmtDateTime(event.at)}{#if event.driver}
                · 운전자 {event.driver.name}{/if}</span
            >
            <span class="text-body-sm">{event.detail}</span>
          </p>
        {/snippet}
      </List>
    </Fold>
  {/if}
  <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-unit-docs-title">
    <h3 id="owner-unit-docs-title" class="text-label-md text-fg-muted">관련 서류</h3>
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
  </section>
  <Button
    variant="outline"
    tone="neutral"
    href={ownerHref(url, 'detail', app, { return: url.pathname + url.search }, device.id)}
    >상세 화면으로 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
  >
</section>
