<script lang="ts">
  // B2-03 현장 상세(본사 웹) — 장비 카드 · 2채널 카메라 월(프로파일) · 미처리 업무에 "확인 요청"만(처리 버튼 없음, DISC-015) (specs/video-basics AC-8)
  import { invalidateAll } from '$app/navigation';
  import { SCR, type Case } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    EmptyState,
    EquipmentCard,
    Inspector,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    Timeline,
    dueLabel,
    toast,
    PageHeader,
  } from '@boomeyes/ui';
  import { CameraWall } from '@boomeyes/video';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const now = $derived(data.clock.now());
  const open = $derived(data.cases.filter((c) => c.state !== 'done'));
  let picked = $state<string | null>(null);
  const selected = $derived(open.find((c) => c.id === picked) ?? open[0] ?? null);
  let busy = $state<string | null>(null);
  async function confirm(c: Case) {
    busy = c.id;
    try {
      await data.api.requestConfirm(c.id, session.user?.userId ?? 'hq01');
      await invalidateAll();
      toast(`확인 요청 — ${c.id}`);
    } catch (e) {
      toast(`확인 요청 실패 — ${(e as Error).message}`);
    } finally {
      busy = null;
    }
  }
</script>

<div
  class="gap-inline-lg grid xl:grid-cols-[minmax(0,1fr)_var(--spacing-layout-inspector-width)]"
  data-scr={SCR['B2-03']}
>
  <div class="gap-stack-lg flex min-w-0 flex-col">
    <PageHeader
      title={data.site.name}
      description="{data.site.id} · {data.site.company} · 장비 {data.devices.length}대 · 열람 전용(확인 요청만)"
      ref="DISC-015"
    >
      {#snippet meta()}
        <Badge tone="neutral" variant="outline"
          ><span data-profile={data.flags.profile}>{data.flags.channels}채널</span></Badge
        >
      {/snippet}
    </PageHeader>
    <section class="gap-stack-sm flex flex-col" aria-label="장비">
      <h2 class="text-heading-md">장비</h2>
      <div class="gap-inline-md grid md:grid-cols-2 xl:grid-cols-3">
        {#each data.devices as d (d.id)}
          <EquipmentCard device={d} summary class="rounded-card border-border bg-surface p-inset-md border" />
        {/each}
      </div>
    </section>
    <CameraWall
      cameras={data.cameras.filter((c) => data.devices.some((d) => d.id === c.deviceId))}
      devices={data.devices}
      sites={data.sites}
      title="카메라 월 — 현장 전체"
    />
  </div>
  <Inspector label="미처리 업무">
    <h2 class="text-heading-md">미처리 업무 {open.length}</h2>
    {#if open.length}
      <ul class="gap-stack-xs flex flex-col" aria-label="업무">
        {#each open as c (c.id)}
          <li>
            <button
              type="button"
              class="rounded-control p-inset-sm hover:bg-ui-hover flex w-full flex-col items-start text-left"
              aria-current={selected?.id === c.id ? 'true' : undefined}
              onclick={() => (picked = c.id)}
            >
              <span class="text-body-md">{c.title}</span>
              <span class="gap-inline-sm text-label-sm text-fg-muted flex items-center"
                ><StatusPill tone={TASK_TONE[c.state]} label={TASK_LABEL[c.state]} size="sm" />
                {c.id} · 기한 {dueLabel(c.dueAt, now).label}</span
              >
            </button>
          </li>
        {/each}
      </ul>
      {#if selected}
        <Button variant="outline" tone="neutral" disabled={busy === selected.id} onclick={() => confirm(selected!)}
          >확인 요청 — {selected.id}</Button
        >
        <Timeline items={selected.history} />
      {/if}
    {:else}
      <EmptyState title="미처리 업무가 없습니다" />
    {/if}
  </Inspector>
</div>
