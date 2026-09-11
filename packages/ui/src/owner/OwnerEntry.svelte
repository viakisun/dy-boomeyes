<script lang="ts">
  import type { OwnerApp } from '@boomeyes/domain';
  import Logo from '../brand/Logo.svelte';
  import Button from '../primitives/Button.svelte';
  import StatusPill from '../primitives/StatusPill.svelte';
  import List from '../primitives/List.svelte';
  import FleetSummary from './FleetSummary.svelte';
  import EquipmentRow from './EquipmentRow.svelte';
  import AlertCard from './AlertCard.svelte';
  import type { OwnerAlert, OwnerDevice } from '@boomeyes/domain';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  let {
    app,
    onstart,
    screen,
    poster,
  }: {
    app: OwnerApp;
    onstart: () => Promise<void>;
    screen: string;
    /** 미리보기 스틸 URL(앱이 주입) */ poster?: string;
  } = $props();
  // 미리보기 — 실제 컴포넌트에 정적 시연 자료(한빛중기 5대 중 2대 + 알림 1건)를 넣는다. 데이터 부팅 전이므로 리터럴.
  const PREVIEW_URL = new URL('https://boomeyes.local/');
  const dev = (unit: number, site: string, extra: Partial<OwnerDevice> = {}): OwnerDevice => ({
    id: `CPB-${String(unit).padStart(3, '0')}`,
    ownerId: 'OWN-001',
    unit,
    model: 'DY CPB 32',
    site,
    address: '',
    location: null,
    deployment: 'deployed',
    connection: 'current',
    receivedAt: '2026-07-03T10:41:00+09:00',
    voltage: 380,
    fault: null,
    inspection: null,
    contract: { company: '한빛건설', from: '2026-06-01', to: '2026-09-30', installed: '2026-06-03' },
    contact: { name: '김현장', job: '현장 담당자', phone: '010-0000-0000' },
    parts: [],
    ...extra,
  });
  const PREVIEW: { at: string; devices: OwnerDevice[]; alerts: OwnerAlert[] } = {
    at: '2026-07-03T10:42:00+09:00',
    devices: [
      dev(1, '마포 주상복합 신축'),
      dev(2, '송도 업무시설 신축', { voltage: 342, fault: '공급 전압 저하' }),
      dev(3, '평택 물류센터'),
      dev(4, '대전 공동주택'),
      dev(5, '용인 장비 보관소', {
        deployment: 'stored',
        connection: 'detached',
        receivedAt: null,
        voltage: null,
        contract: null,
        contact: null,
      }),
    ],
    alerts: [
      {
        id: 'CPB-002-FAULT',
        deviceId: 'CPB-002',
        kind: 'fault',
        title: '공급 전압 저하',
        detail: '',
        at: '2026-07-03T10:38:00+09:00',
        read: false,
      },
    ],
  };

  let busy = $state(false);
  let error = $state('');
  async function start() {
    busy = true;
    error = '';
    try {
      await onstart();
    } catch {
      error = '데모를 시작하지 못했습니다. 다시 시도해 주세요.';
    } finally {
      busy = false;
    }
  }
</script>

<main
  data-scr={screen}
  data-owner-view="entry"
  data-owner-root
  data-owner-app={app}
  data-density="comfortable"
  class="bg-canvas text-fg p-page-gutter flex min-h-dvh flex-col"
>
  <header class="max-w-layout-container-max py-stack-lg gap-inline-sm mx-auto flex w-full items-center justify-between">
    <Logo variant="lockup" color label="BoomEyes" class="h-size-avatar-md w-auto" />
    <span class="text-label-md text-fg-muted">소유주 데모</span>
  </header>
  <div
    class="max-w-layout-container-max gap-stack-xl py-stack-xl mx-auto grid w-full flex-1 items-center lg:grid-cols-2"
  >
    <section class="gap-stack-xl max-w-layout-prose-width flex flex-col">
      <p class="text-accent-fg text-label-lg font-semibold">보유 장비, 한눈에</p>
      <h1 class="text-display-lg tracking-tight">전국의 장비를<br />내 손안에서.</h1>
      <p class="text-body-lg text-fg-muted">
        어느 현장에 있는지, 누구에게 연락할지.<br />장비를 찾고 계약과 서류까지 확인하세요.
      </p>
      <div class="gap-stack-sm flex flex-col">
        <Button class="min-h-size-touch-min w-full" size="lg" onclick={start} loading={busy}
          >데모 시작하기 <ArrowRight class="size-size-icon-lg" aria-hidden="true" /></Button
        >
        {#if error}<p role="alert" class="text-danger-fg text-body-md">{error}</p>{/if}
      </div>
    </section>
    <section
      class="rounded-card bg-surface shadow-raised p-inset-md gap-stack-md flex min-w-0 flex-col"
      aria-label="소유주 화면 미리보기"
    >
      <div class="rounded-card bg-media-bg relative aspect-video overflow-hidden">
        {#if poster}<img src={poster} alt="" class="h-full w-full object-cover" />{/if}
        <StatusPill solid tone="neutral" label="타설 위치 · 10:41" class="top-stack-sm left-stack-sm absolute" />
      </div>
      <FleetSummary devices={PREVIEW.devices} alerts={PREVIEW.alerts} {app} url={PREVIEW_URL} interactive={false} />
      <List items={PREVIEW.devices.slice(0, 2)} key={(d) => d.id} label="미리보기 장비" variant="plain">
        {#snippet item(device)}<EquipmentRow {device} now={PREVIEW.at} />{/snippet}
      </List>
      <AlertCard
        alert={PREVIEW.alerts[0]!}
        device={PREVIEW.devices[1]}
        now={PREVIEW.at}
        class="bg-surface-sunken rounded-control"
      />
    </section>
  </div>
  <footer class="text-body-sm text-fg-muted max-w-layout-container-max py-stack-lg mx-auto w-full">
    시연용 데이터와 영상입니다. 실제 장비에 연결되지 않습니다.
  </footer>
</main>
