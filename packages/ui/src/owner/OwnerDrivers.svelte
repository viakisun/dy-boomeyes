<script lang="ts">
  // 운전자 — 소유주 소속이고 배정이 매일 바뀐다(시안 «확정 2026-09-12» · FR-027).
  // 명단(오늘 배정·자격 만료)과 서류(사람 4종)를 한 화면의 두 갈래로 둔다 — 새 메뉴를 만들지 않는다.
  import Phone from '@lucide/svelte/icons/phone';
  import { OWNER_DRIVER_DOC_KINDS, ownerHref, type OwnerDriver, type OwnerViewProps } from '@boomeyes/domain';
  import type { Column } from '../lib/table';
  import { cx, TONE } from '../lib/cx';
  import { dueLabel } from '../lib/format';
  import PageHeader from '../primitives/PageHeader.svelte';
  import DataTable from '../primitives/DataTable.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import { OWNER_CONTRACT_TABS, ownerControl, ownerDate } from './core-helpers';
  let { data, app, url, view }: OwnerViewProps & { view: 'drivers' | 'driver-docs' } = $props();
  const web = $derived(app === 'web');
  const drivers = $derived([...data.drivers].sort((a, b) => a.name.localeCompare(b.name, 'ko')));
  const docsOf = (driver: OwnerDriver) => data.driverDocs.filter((d) => d.driverId === driver.id);
  const unitOf = (driver: OwnerDriver) => data.devices.find((d) => d.id === driver.assignedTo);
  /** 만료가 30일 이내면 주의, 지났으면 위험. 없는 서류는 미비다. */
  const expiry = (at: string | null) => {
    if (!at) return null;
    const due = dueLabel(at, new Date(data.at));
    const days = Number(due.label.replace(/D[-+]/, ''));
    return { ...due, soon: due.overdue || (due.label.startsWith('D-') && days <= 30) };
  };
  const LIST_COLUMNS: Column[] = [
    { key: 'name', label: '운전자', nowrap: true },
    { key: 'today', label: '오늘 배정' },
    // 전원 같은 자격이라 값이 짧다 — 남는 폭은 「오늘 배정」이 받는다(기본 text 열은 잘린다)
    { key: 'license', label: '면허', nowrap: true },
    { key: 'expires', label: '면허 만료', kind: 'date' },
    { key: 'docs', label: '서류', kind: 'status' },
    { key: 'phone', label: '연락처', kind: 'status' },
  ];
  const DOC_COLUMNS: Column[] = [
    { key: 'name', label: '운전자', nowrap: true },
    ...OWNER_DRIVER_DOC_KINDS.map((kind) => ({ key: kind, label: kind, kind: 'status' as const })),
  ];
</script>

<div class="gap-stack-xl flex min-w-0 flex-col" data-owner-drivers={view}>
  <PageHeader
    title={view === 'drivers' ? '운전자' : '운전자 서류'}
    description={view === 'drivers'
      ? '소속 운전자와 오늘 배정입니다. 배정은 매일 바뀝니다'
      : '사람에 속한 서류 4종입니다. 차량 서류는 호기 화면에 있습니다'}
  />
  <nav aria-label="계약·운전자" class="gap-inline-sm flex flex-wrap">
    {#each OWNER_CONTRACT_TABS as tab (tab.view)}
      <a
        href={ownerHref(url, tab.view, app)}
        aria-current={view === tab.view ? 'page' : undefined}
        class={cx(
          ownerControl(),
          'rounded-pill px-inset-md text-label-md inline-flex items-center',
          view === tab.view ? 'bg-accent text-accent-on-solid' : 'bg-surface-sunken text-fg-muted',
        )}>{tab.label}</a
      >
    {/each}
  </nav>
  {#if drivers.length === 0}
    <EmptyState
      title="등록된 운전자가 없습니다"
      description="운전자가 등록되면 오늘 배정과 자격을 확인할 수 있습니다."
    />
  {:else if view === 'drivers'}
    <p class="text-body-md" role="status">
      전체 <strong>{drivers.length}명</strong> · 오늘 배정
      <strong>{drivers.filter((v) => v.assignedTo).length}명</strong> · 자격 만료 임박
      <strong>{drivers.filter((v) => expiry(v.licenseTo)?.soon).length}명</strong>
    </p>
    {#if web}
      <DataTable
        columns={LIST_COLUMNS}
        rows={drivers}
        rowKey={(v) => v.id}
        rowAttrs={(v) => ({ 'data-driver': v.id })}
        caption="운전자 명단"
      >
        {#snippet cell(driver: OwnerDriver, column: Column)}
          {#if column.key === 'name'}
            {driver.name}
          {:else if column.key === 'today'}
            {@const unit = unitOf(driver)}
            {#if unit}<a class="{ownerControl()} text-accent-fg" href={ownerHref(url, 'detail', app, {}, unit.id)}
                >{unit.unit}호기 · {unit.site}</a
              >{:else}<span class="text-fg-muted">오늘 배정 없음</span>{/if}
          {:else if column.key === 'license'}
            {driver.license}
          {:else if column.key === 'expires'}
            {@const due = expiry(driver.licenseTo)}
            <span class={due?.soon ? 'text-warning-fg' : undefined}>{ownerDate(driver.licenseTo)} · {due?.label}</span>
          {:else if column.key === 'docs'}
            {@const missing = OWNER_DRIVER_DOC_KINDS.length - docsOf(driver).length}
            {#if missing > 0}<span class="rounded-pill px-inset-xs text-label-sm {TONE.warning.subtle}"
                >{missing}건 미비</span
              >{:else}{docsOf(driver).length}종{/if}
          {:else}
            <a class="{ownerControl()} text-accent-fg gap-inline-xs inline-flex items-center" href="tel:{driver.phone}">
              <Phone class="size-size-icon-sm" aria-hidden="true" />{driver.phone}
            </a>
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <ul class="gap-stack-sm flex list-none flex-col p-0">
        {#each drivers as driver (driver.id)}
          {@const unit = unitOf(driver)}
          {@const due = expiry(driver.licenseTo)}
          <li
            data-driver={driver.id}
            class="bg-surface rounded-card border-border-subtle p-inset-md gap-stack-xs flex flex-col border"
          >
            <div class="gap-inline-sm flex flex-wrap items-center justify-between">
              <span class="text-heading-sm">{driver.name}</span>
              <a
                class="{ownerControl()} text-accent-fg gap-inline-xs inline-flex items-center"
                href="tel:{driver.phone}"
              >
                <Phone class="size-size-icon-sm" aria-hidden="true" />{driver.phone}
              </a>
            </div>
            <p class="text-body-md">
              {#if unit}<a class="text-accent-fg" href={ownerHref(url, 'detail', app, {}, unit.id)}
                  >{unit.unit}호기 · {unit.site}</a
                >{:else}<span class="text-fg-muted">오늘 배정 없음</span>{/if}
            </p>
            <p class="text-body-sm {due?.soon ? 'text-warning-fg' : 'text-fg-muted'}">
              {driver.license} · {ownerDate(driver.licenseTo)} 만료 ({due?.label})
            </p>
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <p class="text-body-md" role="status">
      전체 <strong>{drivers.length}명</strong> · 미비
      <strong>{drivers.filter((v) => docsOf(v).length < OWNER_DRIVER_DOC_KINDS.length).length}명</strong> · 만료 임박
      <strong>{data.driverDocs.filter((d) => expiry(d.expiresAt)?.soon).length}건</strong>
    </p>
    {#if web}
      <DataTable
        columns={DOC_COLUMNS}
        rows={drivers}
        rowKey={(v) => v.id}
        rowAttrs={(v) => ({ 'data-driver': v.id })}
        caption="운전자 서류"
      >
        {#snippet cell(driver: OwnerDriver, column: Column)}
          {#if column.key === 'name'}
            {driver.name}
          {:else}
            {@render docCell(driver, column.key)}
          {/if}
        {/snippet}
      </DataTable>
    {:else}
      <ul class="gap-stack-sm flex list-none flex-col p-0">
        {#each drivers as driver (driver.id)}
          <li
            data-driver={driver.id}
            class="bg-surface rounded-card border-border-subtle p-inset-md gap-stack-xs flex flex-col border"
          >
            <span class="text-heading-sm">{driver.name}</span>
            <ul class="gap-stack-xs flex list-none flex-col p-0">
              {#each OWNER_DRIVER_DOC_KINDS as kind (kind)}
                <li class="gap-inline-sm text-body-md flex flex-wrap items-center justify-between">
                  <span>{kind}</span>{@render docCell(driver, kind)}
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

{#snippet docCell(driver: OwnerDriver, kind: string)}
  {@const doc = docsOf(driver).find((d) => d.kind === kind)}
  {#if !doc}
    <span data-doc-state="missing" class="rounded-pill px-inset-xs text-label-sm {TONE.warning.subtle}">미비</span>
  {:else if doc.expiresAt === null}
    <span data-doc-state="valid" class="text-fg-muted">제출</span>
  {:else}
    {@const due = expiry(doc.expiresAt)}
    <span
      data-doc-state={due?.soon ? 'expiring' : 'valid'}
      class={due?.soon ? `rounded-pill px-inset-xs text-label-sm ${TONE.warning.subtle}` : undefined}
      >{ownerDate(doc.expiresAt)}{due?.soon ? ` · ${due.label}` : ''}</span
    >
  {/if}
{/snippet}
