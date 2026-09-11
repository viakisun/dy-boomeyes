<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { ownerHref, type OwnerApi, type OwnerView, type OwnerDevice, type EquipmentState } from '@boomeyes/domain';
  import { OwnerWorkspace } from '@boomeyes/ui';
  import { OwnerVideo } from '@boomeyes/video';
  import { MapView } from '@boomeyes/map';
  let { api, view, capture = false }: { api: OwnerApi; view: OwnerView; capture?: boolean } = $props();
  const APP = 'pwa';
  const navigate = (href: string) => {
    const target = new URL(href, page.url);
    const same = target.pathname === page.url.pathname;
    void goto(resolve((target.pathname + target.search) as '/'), {
      replaceState: same,
      noScroll: same,
      keepFocus: same,
    });
  };
  const markers = (devices: OwnerDevice[]) =>
    devices
      .filter((d) => d.location)
      .map((d) => ({
        id: d.id,
        lat: d.location!.lat,
        lng: d.location!.lng,
        state: (d.fault
          ? 'fault'
          : d.inspection
            ? 'caution'
            : d.connection === 'stale' || d.connection === 'detached'
              ? 'offline'
              : 'normal') as EquipmentState,
        label: `${d.unit}호기`,
        description: `${d.unit}호기 · ${d.site}${d.connection === 'stale' ? ' · 마지막 수신 위치' : d.connection === 'detached' ? ' · 등록 보관 위치' : ''}`,
      }));
</script>

<OwnerWorkspace {api} {view} app={APP} url={page.url} {navigate} {capture}>
  {#snippet video(props)}<OwnerVideo {...props} />{/snippet}
  {#snippet map(devices)}
    <div class="rounded-card h-full w-full min-w-0 flex-1 overflow-hidden" aria-label="보유 장비 위치 지도">
      <MapView
        fitMarkers
        markers={markers(devices)}
        zoom={6}
        onselect={(id) => navigate(ownerHref(page.url, 'detail', APP, {}, id))}
        class="h-full"
      />
    </div>
  {/snippet}
</OwnerWorkspace>
