<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    OWNER_DEMO,
    OWNER_DEMO_WAVE,
    SCREENS,
    ownerScreen,
    type OwnerApi,
    type OwnerApp,
    type OwnerAiEvent,
    type OwnerCamera,
    type OwnerMapScene,
    type OwnerSnapshot,
    type OwnerView,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import OwnerOverview from './OwnerOverview.svelte';
  import OwnerFleet from './OwnerFleet.svelte';
  import OwnerRequests from './OwnerRequests.svelte';
  import OwnerDrivers from './OwnerDrivers.svelte';
  import OwnerDetail from './OwnerDetail.svelte';
  import OwnerDocuments from './OwnerDocuments.svelte';
  import OwnerAlerts from './OwnerAlerts.svelte';
  import Button from '../primitives/Button.svelte';
  import { bellSlot } from './bell.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  let {
    api,
    app,
    view,
    url,
    navigate,
    capture = false,
    sim = false,
    video,
    map,
    live,
    aiShot,
  }: {
    api: OwnerApi;
    app: OwnerApp;
    view: OwnerView;
    url: URL;
    navigate: OwnerViewProps['navigate'];
    capture?: boolean;
    sim?: boolean;
    video: Snippet<[OwnerViewProps]>;
    /** 현황·상세의 지도 — 장면(OwnerMapScene)을 받아 앱이 MapView로 그린다 */
    map?: Snippet<[OwnerMapScene]>;
    /** 호기 패널의 실시간 영상 타일(카메라 · 접근 이름 · capture) */
    live?: Snippet<[OwnerCamera, string, boolean, boolean]>;
    aiShot?: Snippet<[OwnerAiEvent]>;
  } = $props();
  let snapshot = $state<OwnerSnapshot>();
  let error = $state('');
  let loading = $state(true);
  const title = $derived(OWNER_DEMO.find((v) => v.view === view)?.label ?? '소유주 운영');
  let generation = 0;
  // 같은 api 객체로 다시 렌더될 때(쿼리 전환·invalidateAll)는 다시 읽지 않는다 — Svelte 5는 객체 prop을 늘 "바뀜"으로 보므로 identity를 직접 비교한다.
  // 드릴다운(?site= · ?device=)마다 로딩 화면과 지도가 다시 만들어지는 것을 막는다. 명시적 갱신은 refresh().
  let bound: OwnerApi | undefined;
  let unsubscribe: (() => void) | undefined;
  async function refresh() {
    const current = ++generation;
    loading = true;
    error = '';
    try {
      const next = await api.snapshot();
      if (current === generation) snapshot = next;
    } catch (e) {
      if (current === generation) error = e instanceof Error ? e.message : '자료를 불러오지 못했습니다.';
    } finally {
      if (current === generation) loading = false;
    }
  }
  $effect(() => {
    const source = api;
    if (source === bound) return;
    bound = source;
    unsubscribe?.();
    unsubscribe = source.subscribe?.(() => void refresh()); // 시뮬레이터 틱 → 다시 읽기(structuredClone 복사본)
    const current = ++generation;
    loading = true;
    error = '';
    snapshot = undefined;
    source
      .snapshot()
      .then((next) => {
        if (current === generation) snapshot = next;
      })
      .catch((e) => {
        if (current === generation) error = e instanceof Error ? e.message : '자료를 불러오지 못했습니다.';
      })
      .finally(() => {
        if (current === generation) loading = false;
      });
    // cleanup으로 generation을 올리지 않는다 — 같은 api로 다시 렌더될 때 첫 스냅샷이 버려져 로딩이 멈추는 사고 방지
  });
  $effect(() => () => unsubscribe?.());
  const viewProps = $derived(snapshot ? { data: snapshot, api, app, url, navigate, refresh, capture, sim } : null);
  // 헤더의 종 알림 패널에 같은 스냅샷을 올린다 — 셸이 따로 불러오면 시뮬레이션 중 시각이 갈린다
  const bell = bellSlot();
  $effect(() => {
    if (!bell) return;
    bell.alerts = snapshot?.alerts ?? [];
    bell.devices = snapshot?.devices ?? [];
    bell.now = snapshot?.at ?? '';
  });
  // 원천에 등록됐지만 아직 만들지 않은 화면(계약·운전자)에는 data-stub를 붙여
  // capture --strict가 자리 화면으로 세게 한다 — 보이지 않는 자리 화면을 남기지 않는다.
  // 판정은 화면의 웨이브에서 나온다(수기 목록이 아니다 — 구현되면 웨이브가 내려와 저절로 풀린다).
  // 한 앱만 웨이브 안이면(lease: web B1-06 웨이브 2 · pwa A4-05 웨이브 5) 그 뷰는 아직 미구현이다 —
  // tools/owner/views.mjs가 「web·pwa 양쪽이 웨이브 이하」를 요구하는 것과 같은 규칙으로 판정한다.
  const built = $derived((['web', 'pwa'] as const).every((a) => SCREENS[ownerScreen(view, a)].wave <= OWNER_DEMO_WAVE));
  const stub = $derived(!built);
</script>

<section
  data-scr={ownerScreen(view, app)}
  data-owner-view={view}
  data-owner-role="owner"
  data-owner-dataset={snapshot?.dataset}
  data-owner-clock={snapshot?.at}
  data-owner-sim={sim ? '1' : '0'}
  data-stub={stub ? '' : undefined}
  aria-busy={loading}
  class="flex min-h-0 min-w-0 flex-1 flex-col"
>
  {#if loading && !snapshot}
    <div role="status" class="gap-stack-lg py-stack-xl flex flex-col">
      <h1 class="text-heading-xl">{title}</h1>
      <p class="text-body-md text-fg-muted">장비 정보를 불러오고 있습니다…</p>
      <div class="bg-surface-sunken rounded-card h-layout-map-min animate-pulse"></div>
    </div>
  {:else if error}
    <div class="gap-stack-lg flex flex-col">
      <h1 class="text-heading-xl">{title}</h1>
      <p role="alert" class="text-danger-fg text-body-md">{error}</p>
      <div><Button onclick={refresh}>다시 시도</Button></div>
    </div>
  {:else if viewProps}
    <!-- 장비가 하나도 없으면 장비를 다루는 화면은 보여 줄 것이 없다. 계약·운전자는 장비 축이
         아니라 요청·사람 축이므로 각자의 빈 화면을 그린다. -->
    {#if viewProps.data.devices.length === 0 && view !== 'requests' && view !== 'drivers' && view !== 'driver-docs'}
      <h1 class="text-heading-xl">{title}</h1>
      <EmptyState
        title="등록된 보유 장비가 없습니다"
        description="장비가 등록되면 이곳에서 위치와 계약 정보를 확인할 수 있습니다."
      />
    {:else if view === 'overview'}<OwnerOverview {...viewProps} {map} {live} {aiShot} />
    {:else if view === 'fleet'}<OwnerFleet {...viewProps} />
    {:else if view === 'requests'}<OwnerRequests {...viewProps} />
    {:else if view === 'drivers' || view === 'driver-docs'}<OwnerDrivers {...viewProps} {view} />
    {:else if view === 'detail'}<OwnerDetail {...viewProps} {map} />
    {:else if view === 'documents'}<OwnerDocuments {...viewProps} />
    {:else if view === 'alerts'}<OwnerAlerts {...viewProps} />
    {:else if view === 'video'}{@render video(viewProps)}
    {:else}
      <!-- 원천에 등록됐지만 아직 만들지 않은 화면(계약·운전자 — 웨이브 5). 빈 본문을 내지 않는다.
           specs/owner-contracts · specs/owner-drivers가 채우면 이 분기는 사라진다. -->
      <EmptyState
        title="준비 중인 화면입니다"
        description="이 업무는 아직 데모에 들어오지 않았습니다. 운영 현황이나 보유 장비에서 계속 보실 수 있습니다."
      />
    {/if}
  {/if}
</section>
