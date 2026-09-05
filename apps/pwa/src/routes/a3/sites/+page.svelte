<script lang="ts">
  // A3-02 현장 목록(본사) — 자사 현장 카드(장비·이상·미처리·에스컬레이션) · 처리 권한 없음(DISC-015) (specs/task-escalation AC-10)
  import { resolve } from '$app/paths';
  import { SCR, type Site } from '@boomeyes/domain';
  import { Card, EmptyState, StatusPill, TASK_TONE } from '@boomeyes/ui';
  let { data } = $props();
  const of = (site: Site) => {
    const devices = data.devices.filter((d) => d.siteId === site.id);
    const cases = data.cases.filter((c) => c.siteId === site.id);
    return {
      devices: devices.length,
      abnormal: devices.filter((d) => d.state !== 'normal').length,
      open: cases.filter((c) => c.state !== 'done').length,
      escalated: cases.filter((c) => c.state === 'escalated').length,
    };
  };
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A3-02']}>
  <p class="text-body-sm text-fg-muted">자사 현장 {data.sites.length} · 열람 + 확인 요청만(직접 처리 불가)</p>
  {#if data.sites.length}
    <ul class="gap-stack-sm flex flex-col" aria-label="현장">
      {#each data.sites as site (site.id)}
        {@const n = of(site)}
        <li>
          <Card
            variant="interactive"
            as="a"
            href={resolve(`/a3/sites/${site.id}` as '/')}
            aria-label="{site.name} 현장 상세"
          >
            {#snippet header()}<span class="text-label-md text-fg-muted">{site.id} · {site.company}</span>{/snippet}
            <h2 class="text-heading-md">{site.name}</h2>
            <div class="gap-inline-sm pt-stack-xs flex flex-wrap" aria-label="{site.name} 요약">
              <StatusPill tone="neutral" label="장비 {n.devices}" size="sm" />
              <StatusPill tone={n.abnormal ? 'danger' : 'success'} label="이상 {n.abnormal}" size="sm" />
              <StatusPill tone={n.open ? 'warning' : 'neutral'} label="미처리 {n.open}" size="sm" />
              {#if n.escalated}<StatusPill
                  tone={TASK_TONE.escalated}
                  label="에스컬레이션 {n.escalated}"
                  size="sm"
                />{/if}
            </div>
          </Card>
        </li>
      {/each}
    </ul>
  {:else}
    <EmptyState title="열람 가능한 현장이 없습니다" description="본사 계정에 현장이 연결되면 여기에 보입니다." />
  {/if}
</div>
