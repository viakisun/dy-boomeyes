<script lang="ts">
  // 호기 상세 — 장비 히어로(display 호기 · 스틸 · StatusPill · Badge · 주 행동) → 미니맵 · 계약(PeriodBar) · 담당자(ContactCard) · 장비 상태(Stat) → 자료 · 부품 · 이력.
  // "장비 상태" 영역은 절대 시각만 쓴다(오프라인 전후 텍스트 동일 — e2e 계약).
  import type { Snippet } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import FileText from '@lucide/svelte/icons/file-text';
  import Video from '@lucide/svelte/icons/video';
  import Phone from '@lucide/svelte/icons/phone';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Building from '@lucide/svelte/icons/building-2';
  import Clock from '@lucide/svelte/icons/clock';
  import Check from '@lucide/svelte/icons/check';
  import Truck from '@lucide/svelte/icons/truck';
  import Wrench from '@lucide/svelte/icons/wrench';
  import {
    OWNER_CONNECTION,
    OWNER_DEPLOYMENT,
    ownerHref,
    type OwnerDevice,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import { cx, OWNER_CONNECTION_TONE } from '../lib/cx';
  import { fmtDateTime } from '../lib/format';
  import EmptyState from '../primitives/EmptyState.svelte';
  import Badge from '../primitives/Badge.svelte';
  import Button from '../primitives/Button.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import IconTile from '../primitives/IconTile.svelte';
  import ContactCard from '../primitives/ContactCard.svelte';
  import PeriodBar from '../primitives/PeriodBar.svelte';
  import ContextHeader from '../primitives/ContextHeader.svelte';
  import KeyValueList from '../primitives/KeyValueList.svelte';
  import List from '../primitives/List.svelte';
  import AlertCard from './AlertCard.svelte';
  import { devicePoster, equipmentCondition, fleetReturn, ownerDate, ownerLink } from './core-helpers';
  let { data, app, url, map }: OwnerViewProps & { map?: Snippet<[OwnerDevice[], string | undefined]> } = $props();
  const deviceId = $derived.by(() => {
    try {
      return decodeURIComponent(url.pathname.split('/fleet/')[1]?.split('/')[0] ?? '');
    } catch {
      return '';
    }
  });
  const device = $derived(data.devices.find((item) => item.id === deviceId));
  const condition = $derived(device ? equipmentCondition(device) : null);
  const documents = $derived(data.documents.filter((item) => item.deviceId === deviceId));
  const alerts = $derived(data.alerts.filter((item) => item.deviceId === deviceId));
  const poster = $derived(devicePoster(data.cameras, deviceId));
  const back = $derived(fleetReturn(url, app));
  const context = $derived({ device: deviceId, return: url.pathname + url.search });
  const contactTitle = $derived(device?.deployment === 'stored' ? '보관 담당자' : '현장 담당자');
</script>

<div class="gap-stack-lg flex min-w-0 flex-col">
  <a href={back} class="{ownerLink()} w-fit"
    ><ChevronLeft class="size-size-icon-md" aria-hidden="true" />장비 목록으로</a
  >
  {#if !device || !condition}
    <EmptyState title="장비를 찾을 수 없습니다" description="소유 장비가 아니거나 등록 정보가 없습니다." />
  {:else}
    <ContextHeader title="{device.unit}호기" subtitle={device.site}>
      {#snippet status()}<StatusPill size="sm" tone={condition.tone} label={condition.label} />{/snippet}
      {#snippet actions()}
        {#if device.contact}<Button size="sm" href="tel:{device.contact.phone.replace(/[^+\d]/g, '')}"
            ><Phone class="size-size-icon-sm" aria-hidden="true" />전화</Button
          >{/if}
      {/snippet}
      {#snippet hero()}
        <header class="gap-stack-lg grid min-w-0 grid-cols-1 items-start lg:grid-cols-12" data-device={device.id}>
          <div class="gap-stack-lg flex min-w-0 flex-col lg:col-span-7">
            <div class="gap-stack-sm flex min-w-0 flex-col">
              <span class="text-code-md text-fg-muted">{device.id} · {device.model}</span>
              <div class="gap-inline-md flex flex-wrap items-center">
                <h1 class="text-display-md">{device.unit}호기</h1>
                <StatusPill tone={condition.tone} label={condition.label}>
                  {#snippet icon()}{#if condition.tone === 'neutral'}<Check
                        class="size-size-icon-sm"
                        aria-hidden="true"
                      />{/if}{/snippet}
                </StatusPill>
                <Badge variant="outline">{OWNER_DEPLOYMENT[device.deployment]}</Badge>
              </div>
              <div class="gap-inline-lg text-body-md text-fg-muted flex flex-wrap items-center">
                <span class="gap-inline-xs flex items-center"
                  ><MapPin class="size-size-icon-sm shrink-0" aria-hidden="true" />{device.site || '위치 미등록'}</span
                >
                {#if device.contract}<span class="gap-inline-xs flex items-center"
                    ><Building class="size-size-icon-sm shrink-0" aria-hidden="true" />{device.contract.company}</span
                  >{/if}
                <span class="gap-inline-xs flex items-center"
                  ><Clock class="size-size-icon-sm shrink-0" aria-hidden="true" />{device.receivedAt
                    ? `${fmtDateTime(device.receivedAt)} 수신`
                    : OWNER_CONNECTION[device.connection]}</span
                >
              </div>
            </div>
            <div class="gap-inline-sm flex flex-wrap items-center">
              {#if device.contact}
                <Button href="tel:{device.contact.phone.replace(/[^+\d]/g, '')}"
                  ><Phone class="size-size-icon-md" aria-hidden="true" />{device.contact.name}에게 전화</Button
                >
              {/if}
              <Button
                variant="outline"
                tone="neutral"
                href={ownerHref(url, 'video', app, { return: url.pathname + url.search }, device.id)}
                ><Video class="size-size-icon-md" aria-hidden="true" />현장 영상</Button
              >
              <Button variant="outline" tone="neutral" href={ownerHref(url, 'documents', app, context)}
                ><FileText class="size-size-icon-md" aria-hidden="true" />장비 서류 <Badge
                  count={documents.length}
                /></Button
              >
            </div>
          </div>
          <div class="rounded-card bg-media-bg relative aspect-video overflow-hidden lg:col-span-5">
            {#if poster}
              <img src={poster} alt="" class="h-full w-full object-cover" />
            {:else}
              <div class="bg-surface-sunken flex h-full w-full items-center justify-center">
                <IconTile><Truck class="size-size-icon-lg" /></IconTile>
              </div>
            {/if}
          </div>
        </header>
      {/snippet}
    </ContextHeader>

    <div class="gap-stack-lg grid min-w-0 grid-cols-1 lg:grid-cols-3">
      <section
        class="gap-stack-md rounded-card bg-surface shadow-raised p-inset-lg flex min-w-0 flex-col"
        aria-labelledby="owner-contract-title"
      >
        <h2 id="owner-contract-title" class="text-label-md text-fg-muted">계약</h2>
        {#if device.contract}
          <p class="text-heading-md tabular-nums">
            <time datetime={device.contract.from}>{ownerDate(device.contract.from)}</time>
            <span class="text-fg-muted" aria-label="부터">–</span>
            <time datetime={device.contract.to}>{ownerDate(device.contract.to)}</time>
          </p>
          <PeriodBar
            start={device.contract.from}
            end={device.contract.to}
            now={data.at}
            label="계약 기간"
            format={ownerDate}
            markers={[{ at: device.contract.installed, label: '설치' }]}
          />
          <KeyValueList
            items={[
              { label: '건설사', value: device.contract.company },
              { label: '설치일', value: ownerDate(device.contract.installed) },
            ]}
          />
        {:else}
          <p class="text-heading-md">{device.deployment === 'stored' ? '진행 중인 계약 없음' : '계약 정보 미등록'}</p>
        {/if}
      </section>
      <section
        class="gap-stack-md rounded-card bg-surface shadow-raised p-inset-lg flex min-w-0 flex-col"
        aria-labelledby="owner-contact-title"
      >
        <h2 id="owner-contact-title" class="text-label-md text-fg-muted">{contactTitle}</h2>
        {#if device.contact}
          <ContactCard name={device.contact.name} role={device.contact.job} phone={device.contact.phone} />
        {:else}
          <p class="text-body-md text-fg-muted">담당자 미등록</p>
        {/if}
      </section>
      <section
        class="gap-stack-md rounded-card bg-surface shadow-raised p-inset-lg flex min-w-0 flex-col"
        aria-labelledby="owner-device-status-title"
      >
        <div class="gap-inline-sm flex flex-wrap items-center justify-between">
          <h2 id="owner-device-status-title" class="text-label-md text-fg-muted">장비 상태</h2>
          <StatusPill
            size="sm"
            tone={OWNER_CONNECTION_TONE[device.connection]}
            label={OWNER_CONNECTION[device.connection]}
          />
        </div>
        <StatusPill tone={condition.tone} label={condition.label}>
          {#snippet icon()}{#if condition.tone === 'neutral'}<Check
                class="size-size-icon-sm"
                aria-hidden="true"
              />{/if}{/snippet}
        </StatusPill>
        {#if device.connection !== 'current'}
          <p class="text-body-sm {device.connection === 'stale' ? 'text-warning-fg' : 'text-fg-muted'}">
            현재 상태를 확인할 수 없습니다.
          </p>
        {/if}
        <div class="gap-stack-xs flex flex-col">
          <span class="text-label-md text-fg-muted"
            >공급 전압{device.connection !== 'current' && device.voltage !== null ? ' · 마지막 수신값' : ''}</span
          >
          <span class={cx('text-display-md tabular-nums', device.fault ? 'text-danger-fg' : 'text-fg')}
            >{device.voltage ?? '—'}{#if device.voltage !== null}<span class="text-body-sm text-fg-muted ml-inline-xs"
                >V</span
              >{/if}</span
          >
          <span class="gap-inline-xs text-body-sm text-fg-muted flex items-center"
            ><Clock class="size-size-icon-sm shrink-0" aria-hidden="true" />{device.receivedAt
              ? `마지막 수신 ${fmtDateTime(device.receivedAt)}`
              : '수신 기록 없음'}</span
          >
        </div>
        {#if device.inspection}<StatusPill size="sm" tone="warning" label={device.inspection} />{/if}
        {#if alerts.length > 0}
          <Button
            variant="ghost"
            href={ownerHref(url, 'alerts', app, { ...context, alert: alerts[0]!.id })}
            class="self-start"
            >관련 알림 {alerts.length}건 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
          >
        {/if}
      </section>
    </div>

    <div class="gap-stack-lg grid min-w-0 grid-cols-1 lg:grid-cols-12">
      {#if map && device.location}
        <div class="rounded-card shadow-raised h-layout-map-min flex overflow-hidden lg:col-span-6">
          {@render map([device], device.id)}
        </div>
      {/if}
      <section
        class="gap-stack-md rounded-card bg-surface shadow-raised p-inset-lg flex min-w-0 flex-col {map &&
        device.location
          ? 'lg:col-span-6'
          : 'lg:col-span-12'}"
        aria-labelledby="owner-parts-title"
      >
        <h2 id="owner-parts-title" class="text-label-md text-fg-muted">마모·교체 부품</h2>
        {#if device.parts.length > 0}
          <ul class="divide-border-subtle divide-y">
            {#each device.parts as part (part.name)}
              <li class="gap-inline-md py-inset-sm flex min-w-0 flex-wrap items-center">
                <IconTile size="md" tone={part.due ? 'warning' : 'neutral'}
                  ><Wrench class="size-size-icon-md" /></IconTile
                >
                <span class="gap-stack-xs flex min-w-0 flex-1 flex-col">
                  <span class="text-body-md font-semibold">{part.name}</span>
                  <span class="text-body-sm text-fg-muted"
                    >{part.measured}{part.reference ? ` · 기준 ${part.reference}` : ''}</span
                  >
                </span>
                {#if part.due}<StatusPill size="sm" tone="warning" label="점검 필요" />{/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-body-sm text-fg-muted">등록된 부품 없음</p>
        {/if}
      </section>
    </div>

    {#if alerts.length > 0}
      <section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-history-title">
        <h2 id="owner-history-title" class="text-heading-sm">이력</h2>
        <List items={alerts} key={(a) => a.id} label="{device.unit}호기 알림 이력">
          {#snippet item(alert)}
            <AlertCard {alert} now={data.at} href={ownerHref(url, 'alerts', app, { ...context, alert: alert.id })} />
          {/snippet}
        </List>
      </section>
    {/if}
  {/if}
</div>
