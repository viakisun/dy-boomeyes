<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { OwnerApi, OwnerView } from '@boomeyes/domain';
  import { OwnerWorkspace } from '@boomeyes/ui';
  import { OwnerVideo, OwnerLiveTile } from '@boomeyes/video';
  import { MapView, ownerCamera, ownerMarkers } from '@boomeyes/map';
  let { api, view, capture = false }: { api: OwnerApi; view: OwnerView; capture?: boolean } = $props();
  const APP = 'web';
  // 같은 경로의 쿼리 교체는 replace(필터·선택), 드릴다운은 push(뒤로가기로 한 단계 위로)
  const navigate = (href: string, opts: { history?: 'push' | 'replace' } = {}) => {
    const target = new URL(href, page.url);
    const same = target.pathname === page.url.pathname;
    void goto(resolve((target.pathname + target.search) as '/'), {
      replaceState: same && opts.history !== 'push',
      noScroll: same,
      keepFocus: same,
    });
  };
</script>

<OwnerWorkspace {api} {view} app={APP} url={page.url} {navigate} {capture}>
  {#snippet video(props)}<OwnerVideo {...props} />{/snippet}
  {#snippet map(scene)}
    <div class="rounded-card h-full w-full min-w-0 flex-1 overflow-hidden" aria-label="보유 장비 위치 지도">
      <MapView
        markers={ownerMarkers(scene)}
        camera={ownerCamera(scene)}
        animate={scene.animate}
        level={scene.level}
        labelLocale="ko"
        onselect={(id, kind) => scene.onselect?.(kind, id)}
        class="h-full"
      />
    </div>
  {/snippet}
  {#snippet live(camera, label, capture)}
    <OwnerLiveTile {camera} {label} {capture} />
  {/snippet}
</OwnerWorkspace>
