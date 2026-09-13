<script lang="ts">
  // 전국 패널 — 확인이 필요한 현장부터(시안 «확정 2026-09-12»). 행은 현장 단위이고 둘째 줄이
  // 상태·사유다. hover → 지도 강조, 클릭 → 현장 단계.
  // 알림은 헤더의 종이 맡는다 — 같은 것을 두 자리에 두지 않는다.
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { ownerHref, ownerSummary, type OwnerApp, type OwnerSite, type OwnerSnapshot } from '@boomeyes/domain';
  import Button from '../primitives/Button.svelte';
  import EmptyState from '../primitives/EmptyState.svelte';
  import List from '../primitives/List.svelte';
  import SiteRow from './SiteRow.svelte';
  import { ownerControl, siteCondition } from './core-helpers';
  let {
    data,
    app,
    url,
    focused,
    siteHref,
    onsite,
    onfocus,
  }: {
    data: OwnerSnapshot;
    app: OwnerApp;
    url: URL;
    focused?: string;
    siteHref: (site: OwnerSite) => string;
    onsite: (site: OwnerSite) => void;
    onfocus: (id?: string) => void;
  } = $props();
  const summary = $derived(ownerSummary(data.devices, data.alerts));
  const sites = $derived(data.sites);
  // 확인할 것이 있는 현장 — 행의 둘째 줄과 같은 판정을 쓴다(두 곳이 갈리면 머리 수와 목록이 어긋난다)
  const attention = $derived(sites.filter((site) => siteCondition(site, data.devices)));
  let all = $state(false);
  // 확인할 현장이 없으면 접을 것이 없다 — 그럴 땐 전체를 보인다
  const rows = $derived(all || attention.length === 0 ? sites : attention);
</script>

<section class="gap-stack-sm flex min-w-0 flex-col" aria-labelledby="owner-attention-title">
  <div class="gap-inline-sm flex flex-wrap items-center justify-between">
    <h2 id="owner-attention-title" class="text-heading-sm" tabindex="-1" data-panel-heading="nation">
      확인 필요 <span class="tabular-nums">{attention.length}개 현장 · {summary.attention}대</span>
    </h2>
    {#if attention.length > 0}
      <button type="button" class="{ownerControl()} text-body-sm text-accent-fg" onclick={() => (all = !all)}>
        {all ? '확인 필요만 보기' : `전체 ${sites.length}개 현장`}
      </button>
    {/if}
  </div>
  {#if rows.length > 0}
    <List items={rows} key={(s) => s.id} label="현장 목록" variant="plain">
      {#snippet item(site)}
        <SiteRow
          {site}
          devices={data.devices}
          alerts={data.alerts}
          href={siteHref(site)}
          selected={focused === site.id}
          onselect={onsite}
          onmouseenter={() => onfocus(site.id)}
          onmouseleave={() => onfocus(undefined)}
        />
      {/snippet}
    </List>
    <div class="gap-inline-sm flex flex-wrap items-center justify-between">
      <p class="text-body-sm text-fg-muted">전체 {data.devices.length}대 · {data.sites.length}개 현장</p>
      <Button variant="ghost" size="sm" href={ownerHref(url, 'fleet', app)}
        >전체 장비 보기 <ArrowRight class="size-size-icon-sm" aria-hidden="true" /></Button
      >
    </div>
  {:else}
    <EmptyState title="표시할 현장 없음" />
  {/if}
</section>
