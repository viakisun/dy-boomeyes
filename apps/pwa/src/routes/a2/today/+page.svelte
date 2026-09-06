<script lang="ts">
  // A2-02 오늘 (specs/driver-daily AC-1 · AC-2 · AC-4 · AC-6) — 오프라인 체크인은 아웃박스(ADR-010)가 받는다, 버튼은 막지 않는다
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, type Alert } from '@boomeyes/domain';
  import {
    Badge,
    Banner,
    Button,
    CheckinCard,
    Dialog,
    ERROR_CODE_LABEL,
    EQUIPMENT_TONE,
    EmptyState,
    SEVERITY_LABEL,
    SEVERITY_TONE,
    StatusPill,
    cx,
    fmtDateTime,
    toast,
  } from '@boomeyes/ui';
  let { data } = $props();
  const EQUIP_LABEL = { normal: '정상', caution: '주의', fault: '고장', offline: '두절', maintenance: '정비' } as const;
  const CONSENT_LABEL = { video: '영상', audio: '음성', location: '위치' } as const;
  let busy = $state(false);
  let denied = $state<string | null>(null);
  let opened = $state<Alert | null>(null);
  const t = $derived(data.today);
  // mock GPS — 현장 좌표(반경 안) · ?gps=out 이면 약 5km 밖
  const pos = () => {
    const s = t.site;
    if (!s) return { lat: 0, lng: 0 };
    return data.gpsOut ? { lat: s.lat + 0.05, lng: s.lng } : { lat: s.lat + 0.0003, lng: s.lng };
  };
  async function run(fn: () => Promise<unknown>, done: string) {
    busy = true;
    try {
      const r = (await fn()) as { pending?: boolean } | undefined; // 아웃박스에 들어갔으면 완료가 아니다
      await invalidateAll();
      toast(r?.pending ? '저장됨 — 연결되면 전송' : done);
    } catch (e) {
      denied = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }
  async function ack(a: Alert) {
    opened = a;
    if (!a.acked) {
      await data.api.ackAlert(a.id);
      await invalidateAll();
    }
  }
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A2-02']}>
  <CheckinCard
    attendance={t.attendance}
    siteName={t.site?.name}
    {busy}
    oncheckin={() => run(() => data.api.checkin(data.userId, pos()), '출근 체크인 완료')}
    oncheckout={() => run(() => data.api.checkout(data.userId), '퇴근 체크아웃 완료')}
  />

  {#if t.inspection.submittedAt}
    <Banner tone="success">작업 전 점검 제출 완료 · {fmtDateTime(t.inspection.submittedAt)}</Banner>
  {:else}
    <Banner tone="warning">
      작업 전 점검 필요 — 체크인 후 5항목을 제출하세요
      {#snippet action()}<Button
          size="sm"
          variant="outline"
          tone="neutral"
          disabled={!t.attendance.checkinAt}
          onclick={() => goto(resolve('/a2/today/inspect' as '/'))}>점검하기</Button
        >{/snippet}
    </Banner>
  {/if}

  {#if t.device}
    {@const d = t.device}
    <a
      href={resolve('/a2/device' as '/')}
      class="rounded-card border-border bg-surface p-inset-md gap-stack-xs hover:border-border-strong flex flex-col border"
      aria-label="배정 장비 {d.id}"
    >
      <div class="flex items-center justify-between">
        <span class="text-heading-sm">{d.id} · {d.unitNo}호기</span>
        <StatusPill tone={EQUIPMENT_TONE[d.state]} label={EQUIP_LABEL[d.state]} size="sm" />
      </div>
      <span class="text-body-sm text-fg-muted">{t.site?.name ?? d.siteId}</span>
      {#if d.telemetry.errorCode}<span class="text-body-sm text-danger-fg"
          >고장코드 {d.telemetry.errorCode} — {ERROR_CODE_LABEL[d.telemetry.errorCode] ?? ''}</span
        >{/if}
      <div class="gap-inline-sm flex items-center">
        {#if t.filming}<Badge tone="danger" variant="solid">● 촬영 중</Badge>{/if}
        <span class="text-label-sm text-fg-muted min-w-0 truncate"
          >동의 · {t.consent.items.map((c) => `${CONSENT_LABEL[c.kind]} ${c.agreed ? '✓' : '✗'}`).join(' · ')}</span
        >
      </div>
    </a>
  {:else}
    <EmptyState title="배정된 장비가 없습니다" description="현장 안전관리자에게 배정을 요청하세요." />
  {/if}

  <section class="gap-stack-sm flex flex-col" aria-label="오늘 알림">
    <h2 class="text-heading-sm">오늘 알림 <span class="text-body-sm text-fg-muted">{t.alerts.length}</span></h2>
    {#if t.alerts.length}
      <ul class="gap-stack-xs flex flex-col">
        {#each t.alerts as a (a.id)}
          <li>
            <button
              type="button"
              class={cx(
                'rounded-control border-border bg-surface px-inset-sm py-inset-xs gap-inline-sm flex w-full items-start border text-left',
                !a.acked && 'bg-surface-sunken',
              )}
              onclick={() => ack(a)}
            >
              <StatusPill tone={SEVERITY_TONE[a.severity]} label={SEVERITY_LABEL[a.severity]} size="sm" />
              <span class="text-body-sm text-fg flex-1">{a.message}</span>
              <span class="text-label-sm text-fg-muted tabular-nums">{fmtDateTime(a.at)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <EmptyState title="오늘 알림이 없습니다" />
    {/if}
  </section>
</div>

<Dialog open={denied !== null} title="체크인할 수 없습니다" onclose={() => (denied = null)}>
  <p class="text-body-md">{denied}</p>
  <p class="text-body-sm text-fg-muted">{t.site?.address}</p>
  {#snippet footer()}<Button onclick={() => (denied = null)}>닫기</Button>{/snippet}
</Dialog>

<Dialog open={opened !== null} title="대응 안내" onclose={() => (opened = null)}>
  {#if opened}
    <p class="text-body-md font-medium">{opened.message}</p>
    {#if opened.kind === 'error' || opened.kind === 'voltage'}
      <p class="text-body-sm text-fg-muted">
        {ERROR_CODE_LABEL[t.device?.telemetry.errorCode ?? ''] ?? '작업을 멈추고 안전관리자·정비 담당에게 알리세요.'}
      </p>
    {:else}
      <p class="text-body-sm text-fg-muted">안내에 따라 조치하고, 이상이 계속되면 안전관리자에게 알리세요.</p>
    {/if}
    <p class="text-body-sm">정비 연락처: {t.maintenance?.display ?? '정비 담당'} · {t.maintenance?.phone ?? '-'}</p>
  {/if}
  {#snippet footer()}<Button onclick={() => (opened = null)}>확인</Button>{/snippet}
</Dialog>
