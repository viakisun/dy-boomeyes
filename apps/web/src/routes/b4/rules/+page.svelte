<script lang="ts">
  // B4-05 알림 기준 (specs/admin-protocol-rules AC-4 알림 8종 · AC-5 고장코드 · AC-6 시나리오 등급 · AC-7 저장 이력)
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type AlertRule, type ErrorCode, type RoleId, type Severity } from '@boomeyes/domain';
  import {
    Badge,
    Banner,
    Button,
    RuleThresholdRow,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusPill,
    Tabs,
    Timeline,
    cx,
    fmtDateTime,
    toast,
    Inspector,
  } from '@boomeyes/ui';
  import { untrack } from 'svelte';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const ROLES: { id: RoleId; label: string }[] = [
    { id: 'control', label: '관제' },
    { id: 'maintenance', label: '정비' },
    { id: 'site-safety', label: '현장 안전관리자' },
    { id: 'hq-safety', label: '본사' },
    { id: 'driver', label: '운전자' },
    { id: 'ops-admin', label: '관리자' },
  ];
  const TABS = [
    { id: 'alerts', label: '알림 기준' },
    { id: 'codes', label: '고장코드' },
    { id: 'scenarios', label: '시나리오 등급' },
  ];
  const SEVERITIES: Severity[] = ['critical', 'warning', 'info'];
  // 편집 사본 — 최초 1회만 데이터에서 초기화(untrack), 탭별 dirty. 저장은 해당 탭만 보내고 그쪽만 리셋한다(다른 탭 편집 유실 방지)
  let alerts = $state<AlertRule[]>(untrack(() => structuredClone(data.rules.alerts)));
  let codes = $state<ErrorCode[]>(untrack(() => structuredClone(data.rules.errorCodes)));
  let dirtyAlerts = $state(false);
  let dirtyCodes = $state(false);
  const dirty = $derived(data.tab === 'codes' ? dirtyCodes : dirtyAlerts);
  let busy = $state(false);
  const me = () => session.user?.userId ?? 'ops01';
  const field = 'h-size-control-sm rounded-control border-border bg-surface px-inset-sm text-body-sm border w-full';
  async function save() {
    const target = data.tab === 'codes' ? 'codes' : 'alerts';
    busy = true;
    try {
      const saved = await data.api.saveRules(
        target === 'codes' ? { errorCodes: $state.snapshot(codes) } : { alerts: $state.snapshot(alerts) },
        me(),
      );
      if (target === 'codes') {
        codes = structuredClone(saved.errorCodes);
        dirtyCodes = false;
      } else {
        alerts = structuredClone(saved.alerts);
        dirtyAlerts = false;
      }
      await invalidateAll();
      toast(`${target === 'codes' ? '고장코드' : '알림 기준'} 저장 완료`);
    } catch (e) {
      toast(`저장 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
  const selectTab = (id: string) =>
    goto(resolve(`/b4/rules?tab=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true });
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B4-05']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <header class="gap-stack-xs flex flex-col">
      <h1 class="text-heading-xl">알림 기준</h1>
      <p class="text-body-sm text-fg-muted">
        알림 8종의 등급·수신 역할·임계와 고장코드 표 — 마지막 갱신 {fmtDateTime(data.rules.updatedAt)} · {data.rules
          .updatedBy}
      </p>
    </header>
    <Tabs tabs={TABS} value={data.tab} onchange={selectTab} />

    {#if data.tab === 'alerts'}
      <section class="gap-stack-sm flex flex-col" aria-label="알림 기준 목록">
        {#each alerts as rule, i (rule.kind)}
          <RuleThresholdRow
            {rule}
            roles={ROLES}
            disabled={busy}
            onchange={(r) => {
              alerts[i] = r;
              dirtyAlerts = true;
            }}
          />
        {/each}
      </section>
    {:else if data.tab === 'codes'}
      <section class="rounded-card border-border bg-surface overflow-x-auto border" aria-label="고장코드 표">
        <table class="text-body-md w-full">
          <thead class="text-label-md text-fg-muted">
            <tr class="border-border-subtle border-b">
              {#each ['코드', '이름', '등급', '원격 진단 가이드'] as h (h)}
                <th scope="col" class="h-size-row-dense px-inset-md text-left font-medium whitespace-nowrap">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each codes as c, i (c.code)}
              <tr class="border-border-subtle border-b last:border-b-0">
                <td class="px-inset-md py-inset-xs text-code-md whitespace-nowrap">{c.code}</td>
                <td class="px-inset-md py-inset-xs"
                  ><input
                    class={field}
                    value={c.name}
                    aria-label="{c.code} 이름"
                    disabled={busy}
                    onchange={(e) => {
                      codes[i] = { ...c, name: e.currentTarget.value };
                      dirtyCodes = true;
                    }}
                  /></td
                >
                <td class="px-inset-md py-inset-xs"
                  ><select
                    class={cx(field, 'w-layout-field-short')}
                    value={c.severity}
                    aria-label="{c.code} 등급"
                    disabled={busy}
                    onchange={(e) => {
                      codes[i] = { ...c, severity: e.currentTarget.value as Severity };
                      dirtyCodes = true;
                    }}
                  >
                    {#each SEVERITIES as s (s)}<option value={s}>{SEVERITY_LABEL[s]}</option>{/each}
                  </select></td
                >
                <td class="px-inset-md py-inset-xs"
                  ><input
                    class={field}
                    value={c.guide}
                    aria-label="{c.code} 가이드"
                    disabled={busy}
                    onchange={(e) => {
                      codes[i] = { ...c, guide: e.currentTarget.value };
                      dirtyCodes = true;
                    }}
                  /></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {:else}
      <Banner tone="neutral"
        >시나리오별 등급은 2단계(2026-10 ~) 적용 항목 — 전도·무동작은 현장 검증 후 잠금을 풉니다 (FR-036 · DISC-042)</Banner
      >
      <section
        class="rounded-card border-border bg-surface divide-border-subtle divide-y border"
        aria-label="시나리오 등급"
      >
        {#each data.rules.scenarios as s (s.id)}
          <div class={cx('px-inset-md py-inset-sm gap-inline-md flex items-center', s.locked && 'bg-surface-sunken')}>
            <span class="text-body-md min-w-0 flex-1 font-medium">{s.title}</span>
            <span class="text-body-sm text-fg-muted">{s.note}</span>
            {#if s.severity === 'none'}<StatusPill tone="neutral" label="무알림" size="sm" />
            {:else}<StatusPill tone={SEVERITY_TONE[s.severity]} label={SEVERITY_LABEL[s.severity]} size="sm" />{/if}
            {#if s.locked}<Badge tone="warning" variant="outline">잠금 · 현장 검증 후</Badge>{/if}
          </div>
        {/each}
      </section>
    {/if}

    {#if data.tab !== 'scenarios'}
      <div class="gap-inline-sm flex items-center">
        <Button onclick={save} disabled={busy || !dirty}>저장</Button>
        <span class="text-body-sm text-fg-muted"
          >{dirty ? '저장되지 않은 변경이 있습니다' : '변경 없음'}{data.tab === 'alerts' && dirtyCodes
            ? ' · 고장코드 탭에 미저장 변경'
            : data.tab === 'codes' && dirtyAlerts
              ? ' · 알림 기준 탭에 미저장 변경'
              : ''}</span
        >
      </div>
    {/if}
  </div>

  <Inspector label="변경 이력">
    <h2 class="text-heading-sm">변경 이력</h2>
    <Timeline items={data.rules.history} />
  </Inspector>
</div>
