<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import FileText from '@lucide/svelte/icons/file-text';
  import Video from '@lucide/svelte/icons/video';
  import Phone from '@lucide/svelte/icons/phone';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import { OWNER_CONNECTION, OWNER_DEPLOYMENT, ownerHref, type OwnerViewProps } from '@boomeyes/domain';
  import EmptyState from '../primitives/EmptyState.svelte';
  import { fmtDateTime } from '../lib/format';
  import { equipmentCondition, fleetReturn, ownerControl, ownerDate, ownerLink } from './core-helpers';
  let { data, app, url }: OwnerViewProps = $props();
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
  const back = $derived(fleetReturn(url, app));
  const context = $derived({ device: deviceId, return: url.pathname + url.search });
</script>

<div class="gap-stack-xl flex min-w-0 flex-col">
  <a href={back} class="{ownerLink()} w-fit"><ArrowLeft class="size-size-icon-md" aria-hidden="true" />장비 목록으로</a>
  {#if !device || !condition}
    <EmptyState
      title="장비를 찾을 수 없습니다"
      description="소유 장비가 아니거나 등록 정보가 없습니다. 장비 목록에서 다시 선택해 주세요."
    />
  {:else}
    <header class="gap-stack-sm flex min-w-0 flex-col" data-device={device.id}>
      <div class="gap-inline-md flex flex-wrap items-baseline">
        <h1 class="text-display-md">{device.unit}호기</h1>
        <span class="text-code-md text-fg-muted">{device.id}</span>
        <span class="text-body-md">{OWNER_DEPLOYMENT[device.deployment]}</span>
      </div>
      <p class="text-heading-md break-words">{device.site || '위치 미등록'}</p>
      <p class="gap-inline-xs text-body-md text-fg-muted flex items-start break-words">
        <MapPin class="size-size-icon-md mt-stack-xs shrink-0" aria-hidden="true" />{device.address || '주소 미등록'}
      </p>
    </header>
    <div class="gap-stack-xl grid min-w-0 grid-cols-1 xl:grid-cols-2">
      <div class="gap-stack-xl flex min-w-0 flex-col">
        <section
          class="gap-stack-lg rounded-card border-border bg-surface p-inset-xl flex min-w-0 flex-col border"
          aria-labelledby="owner-contract-title"
        >
          <div class="gap-inline-sm flex flex-wrap items-center justify-between">
            <h2 id="owner-contract-title" class="text-heading-md">계약 정보</h2>
            <span class="text-body-sm text-fg-muted">{device.model}</span>
          </div>
          {#if device.contract}
            <p class="text-heading-lg break-words">{device.contract.company}</p>
            <div class="gap-stack-sm flex flex-col">
              <h3 class="text-body-md text-fg-muted">계약 기간</h3>
              <div class="gap-inline-md flex flex-wrap items-center">
                <time class="text-heading-md tabular-nums" datetime={device.contract.from}
                  >{ownerDate(device.contract.from)}</time
                >
                <span class="text-fg-muted" aria-label="부터">—</span>
                <time class="text-heading-md tabular-nums" datetime={device.contract.to}
                  >{ownerDate(device.contract.to)}</time
                >
              </div>
            </div>
            <dl class="gap-inline-md border-border pt-inset-lg flex flex-wrap justify-between border-t">
              <dt class="text-body-md text-fg-muted">설치일</dt>
              <dd class="text-body-md tabular-nums">{ownerDate(device.contract.installed)}</dd>
            </dl>
          {:else}
            <p class="text-heading-md">{device.deployment === 'stored' ? '진행 중인 계약 없음' : '계약 정보 미등록'}</p>
          {/if}
        </section>
        <section
          class="gap-stack-lg rounded-card border-border bg-surface p-inset-xl flex min-w-0 flex-col border"
          aria-labelledby="owner-contact-title"
        >
          <h2 id="owner-contact-title" class="text-heading-md">
            {device.deployment === 'stored' ? '보관 담당자' : '현장 담당자'}
          </h2>
          {#if device.contact}
            <div class="gap-inline-md flex flex-wrap items-center justify-between">
              <div class="gap-stack-xs flex min-w-0 flex-col">
                <p class="text-heading-lg break-words">{device.contact.name}</p>
                <p class="text-body-md text-fg-muted break-words">{device.contact.job}</p>
              </div>
              <a
                href="tel:{device.contact.phone.replace(/[^+\d]/g, '')}"
                class="{ownerLink()} border-border-strong border"
                ><Phone class="size-size-icon-md" aria-hidden="true" />{device.contact.phone}</a
              >
            </div>
          {:else}
            <p class="text-body-md text-fg-muted">담당자 미등록</p>
          {/if}
        </section>
      </div>
      <section
        class="gap-stack-lg rounded-card border-border bg-surface p-inset-xl flex min-w-0 flex-col border"
        aria-labelledby="owner-device-status-title"
      >
        <div class="gap-inline-sm flex flex-wrap items-center justify-between">
          <h2 id="owner-device-status-title" class="text-heading-md">장비 상태</h2>
          <span class="text-body-md {device.connection === 'stale' ? 'text-warning-fg' : 'text-fg-muted'}"
            >{OWNER_CONNECTION[device.connection]}</span
          >
        </div>
        <p
          class="text-heading-md break-words {condition.tone === 'danger'
            ? 'text-danger-fg'
            : condition.tone === 'warning'
              ? 'text-warning-fg'
              : 'text-fg'}"
        >
          {condition.label}
        </p>
        {#if device.connection !== 'current'}
          <p class="text-body-md {device.connection === 'stale' ? 'text-warning-fg' : 'text-fg-muted'}">
            현재 상태를 확인할 수 없습니다.
          </p>
        {/if}
        <div class="gap-stack-sm border-border py-inset-lg flex flex-col border-y">
          <p class="text-body-md text-fg-muted">
            공급 전압{device.connection !== 'current' && device.voltage !== null ? ' · 마지막 수신값' : ''}
          </p>
          <p class="text-display-md tabular-nums {device.fault ? 'text-danger-fg' : 'text-fg'}">
            {device.voltage ?? '—'}{#if device.voltage !== null}<span class="text-body-lg ml-inline-xs">V</span>{/if}
          </p>
          <p class="text-body-sm text-fg-muted">
            {device.receivedAt ? `마지막 수신 ${fmtDateTime(device.receivedAt)}` : '수신 기록 없음'}
          </p>
        </div>
        {#if device.inspection}
          <p class="text-body-md text-warning-fg break-words">{device.inspection}</p>
        {/if}
        {#if alerts.length > 0}
          <a
            href={ownerHref(url, 'alerts', app, { ...context, alert: alerts[0]!.id })}
            class="{ownerLink()} border-border-strong w-full border"
            >관련 알림 {alerts.length}건 보기 <ArrowRight class="size-size-icon-md" aria-hidden="true" /></a
          >
        {/if}
      </section>
    </div>
    <section class="gap-stack-md flex flex-col" aria-labelledby="owner-equipment-material-title">
      <h2 id="owner-equipment-material-title" class="text-heading-md">장비 자료</h2>
      <div class="gap-inline-lg grid min-w-0 grid-cols-1 sm:grid-cols-2">
        <a
          href={ownerHref(url, 'documents', app, context)}
          class="{ownerControl()} gap-inline-md rounded-card border-border bg-surface p-inset-lg hover:bg-ui-hover flex min-w-0 items-center border"
        >
          <FileText class="size-size-icon-xl text-fg-muted shrink-0" aria-hidden="true" />
          <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
            <p class="text-heading-sm">장비 서류 <span class="ml-inline-xs tabular-nums">{documents.length}개</span></p>
          </div>
          <ArrowRight class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
        </a>
        <a
          href={ownerHref(url, 'video', app, { return: url.pathname + url.search }, device.id)}
          class="{ownerControl()} gap-inline-md rounded-card border-border bg-surface p-inset-lg hover:bg-ui-hover flex min-w-0 items-center border"
        >
          <Video class="size-size-icon-xl text-fg-muted shrink-0" aria-hidden="true" />
          <div class="gap-stack-xs flex min-w-0 flex-1 flex-col">
            <p class="text-heading-sm">현장 영상</p>
          </div>
          <ArrowRight class="size-size-icon-md text-fg-muted shrink-0" aria-hidden="true" />
        </a>
      </div>
    </section>
    <section class="gap-stack-md flex min-w-0 flex-col" aria-labelledby="owner-parts-title">
      <h2 id="owner-parts-title" class="text-heading-md">마모·교체 부품 점검</h2>
      {#if device.parts.length > 0}
        <dl class="rounded-card border-border bg-surface divide-border divide-y border">
          {#each device.parts as part (part.name)}
            <div class="gap-inline-lg p-inset-lg grid min-w-0 grid-cols-1 sm:grid-cols-2">
              <dt class="text-body-md font-semibold">{part.name}</dt>
              <dd class="gap-stack-xs flex min-w-0 flex-col">
                <span class="text-body-md {part.due ? 'text-warning-fg' : 'text-fg'}">{part.measured}</span><span
                  class="text-body-sm text-fg-muted"
                  >{part.reference ? `점검 기준 ${part.reference}` : '점검 기준 미등록'}</span
                >{#if part.due}<span class="text-body-md text-warning-fg">점검 필요</span>{/if}
              </dd>
            </div>
          {/each}
        </dl>
      {:else}
        <p class="rounded-card border-border p-inset-lg text-body-md text-fg-muted border">
          등록된 부품 점검 정보가 없습니다.
        </p>
      {/if}
    </section>
  {/if}
</div>
