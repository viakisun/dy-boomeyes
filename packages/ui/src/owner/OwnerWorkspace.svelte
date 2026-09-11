<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    OWNER_DEMO,
    ownerScreen,
    type OwnerApi,
    type OwnerApp,
    type OwnerDevice,
    type OwnerSnapshot,
    type OwnerView,
    type OwnerViewProps,
  } from '@boomeyes/domain';
  import OwnerOverview from './OwnerOverview.svelte';
  import OwnerFleet from './OwnerFleet.svelte';
  import OwnerDetail from './OwnerDetail.svelte';
  import OwnerDocuments from './OwnerDocuments.svelte';
  import OwnerAlerts from './OwnerAlerts.svelte';
  import Button from '../primitives/Button.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  let {
    api,
    app,
    view,
    url,
    navigate,
    capture = false,
    video,
    map,
  }: {
    api: OwnerApi;
    app: OwnerApp;
    view: OwnerView;
    url: URL;
    navigate: (href: string) => void;
    capture?: boolean;
    video: Snippet<[OwnerViewProps]>;
    map?: Snippet<[OwnerDevice[]]>;
  } = $props();
  let snapshot = $state<OwnerSnapshot>();
  let error = $state('');
  let loading = $state(true);
  const title = $derived(OWNER_DEMO.find((v) => v.view === view)?.label ?? '소유주 운영');
  let generation = 0;
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
    return () => {
      generation++;
    };
  });
  const viewProps = $derived(snapshot ? { data: snapshot, api, app, url, navigate, refresh, capture } : null);
</script>

<section
  data-scr={ownerScreen(view, app)}
  data-owner-view={view}
  data-owner-role="owner"
  data-owner-dataset={snapshot?.dataset}
  data-owner-clock={snapshot?.at}
  aria-busy={loading}
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
    {#if viewProps.data.devices.length === 0}
      <h1 class="text-heading-xl">{title}</h1>
      <EmptyState
        title="등록된 보유 장비가 없습니다"
        description="장비가 등록되면 이곳에서 위치와 계약 정보를 확인할 수 있습니다."
      />
    {:else if view === 'overview'}<OwnerOverview {...viewProps} {map} />
    {:else if view === 'fleet'}<OwnerFleet {...viewProps} />
    {:else if view === 'detail'}<OwnerDetail {...viewProps} {map} />
    {:else if view === 'documents'}<OwnerDocuments {...viewProps} />
    {:else if view === 'alerts'}<OwnerAlerts {...viewProps} />
    {:else if view === 'video'}{@render video(viewProps)}{/if}
  {/if}
</section>
