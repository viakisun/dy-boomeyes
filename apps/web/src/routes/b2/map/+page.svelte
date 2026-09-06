<script lang="ts">
  // B2-02 본사 지도 — 자사 현장 2의 장비 마커(상태색) + 현장 카드 · 마커/카드 선택 → B2-03 현장 상세 · "보고 모드" → B2-04 · 처리 액션 없음(본사 = 열람 + 확인 요청, DISC-015) (specs/sites-assets-leases AC-4 · FR-003)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, profileFlags, type Device } from '@boomeyes/domain';
  import { MapView } from '@boomeyes/map';
  import { Badge, EQUIPMENT_LABEL, EQUIPMENT_TONE, PageHeader, Stat, StatusPill } from '@boomeyes/ui';
  let { data } = $props();
  const markers = $derived(
    data.devices.map((d) => ({ id: d.id, lat: d.lat, lng: d.lng, state: d.state, label: `${d.unitNo}호기` })),
  );
  const devicesOf = (siteId: string) => data.devices.filter((d) => d.siteId === siteId);
  const abnormalOf = (siteId: string) => devicesOf(siteId).filter((d) => d.state !== 'normal');
  const STATES: Device['state'][] = ['normal', 'caution', 'fault', 'offline', 'maintenance'];
  // 마커 선택 → 그 호기의 현장 상세(B2-03)
  const open = (deviceId: string) => {
    const d = data.devices.find((x) => x.id === deviceId);
    if (d) goto(resolve(`/b2/sites/${d.siteId}` as '/'));
  };
</script>

<div class="gap-stack-lg flex min-w-0 flex-col" data-scr={SCR['B2-02']}>
  <PageHeader
    title="본사 지도"
    description="자사 현장 {data.sites.length} · CPB {data.kpis.total}대 · 열람 전용(확인 요청은 현장 상세에서)"
    ref="DISC-015"
  >
    {#snippet actions()}
      <a
        href={resolve('/b2/report' as '/')}
        class="rounded-control border-border bg-surface px-inset-md h-size-control-md text-body-md text-fg hover:bg-ui-hover inline-flex items-center border"
        >보고 모드</a
      >
    {/snippet}
  </PageHeader>
  <div class="gap-inline-md grid grid-cols-2 md:grid-cols-4" aria-label="장비 요약">
    <Stat label="전체" value={data.kpis.total} unit="대" tone="neutral" hint="현장 {data.sites.length}" />
    <Stat label="정상" value={data.kpis.normal} unit="대" tone="success" />
    <Stat
      label="이상"
      value={data.kpis.caution + data.kpis.fault + data.kpis.offline}
      unit="대"
      tone={data.kpis.fault || data.kpis.offline ? 'danger' : 'warning'}
      hint="주의 · 고장 · 두절"
    />
    <Stat
      label="미처리 업무"
      value={data.kpis.openCases}
      unit="건"
      tone={data.kpis.escalated ? 'danger' : 'info'}
      hint="에스컬레이션 {data.kpis.escalated}"
    />
  </div>
  <section class="gap-inline-lg grid grid-cols-1 lg:grid-cols-[3fr_2fr]" aria-label="위치 · 현장">
    <div class="gap-stack-sm min-h-layout-panel-height flex flex-col">
      <h2 class="text-heading-sm">위치 · 상태</h2>
      <div class="min-h-layout-map-min flex-1"><MapView {markers} onselect={open} /></div>
      <div class="gap-inline-sm text-label-sm text-fg-muted flex flex-wrap">
        {#each STATES as st (st)}<StatusPill tone={EQUIPMENT_TONE[st]} label={EQUIPMENT_LABEL[st]} size="sm" />{/each}
      </div>
    </div>
    <div class="gap-stack-sm flex flex-col">
      <h2 class="text-heading-sm">현장 {data.sites.length}</h2>
      <ul class="gap-stack-sm flex flex-col" aria-label="현장 목록">
        {#each data.sites as s (s.id)}
          {@const abnormal = abnormalOf(s.id)}
          <li>
            <a
              href={resolve(`/b2/sites/${s.id}` as '/')}
              class="rounded-card border-border bg-surface p-inset-md gap-stack-xs hover:bg-ui-hover flex flex-col border"
              data-site={s.id}
            >
              <div class="flex items-center justify-between">
                <span class="text-heading-sm">{s.name}</span>
                <Badge tone={abnormal.length ? 'danger' : 'success'}
                  >{abnormal.length ? `이상 ${abnormal.length}` : '정상'}</Badge
                >
              </div>
              <span class="text-body-sm text-fg-muted"
                >{s.id} · {s.company} · 장비 {devicesOf(s.id).length}대 · {profileFlags(s.videoProfile)
                  .channels}채널</span
              >
              <div class="gap-inline-sm flex flex-wrap">
                {#each devicesOf(s.id) as d (d.id)}<StatusPill
                    tone={EQUIPMENT_TONE[d.state]}
                    label="{d.unitNo}호기 {EQUIPMENT_LABEL[d.state]}"
                    size="sm"
                  />{/each}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
</div>
