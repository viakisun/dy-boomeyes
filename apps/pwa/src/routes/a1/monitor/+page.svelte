<script lang="ts">
  // A1-04 현장 모니터 (specs/video-basics AC-1 타일·헬스 · AC-2 AI 이벤트 bbox · AC-6 바디캠 자리)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { SCR, type Alert } from '@boomeyes/domain';
  import { Badge, Banner, EmptyState, Tabs, fmtTime, toast, EquipmentCard } from '@boomeyes/ui';
  import { BboxOverlay, CameraTile, HealthBadge } from '@boomeyes/video';
  let { data } = $props();
  const tabs = $derived([
    { id: 'cameras', label: '카메라' },
    ...(data.flags.bodycam ? [{ id: 'bodycam', label: '바디캠' }] : []),
  ]);
  // AX-1 1채널 프로파일이면 AI 채널 숨김
  const camsOf = (deviceId: string) =>
    data.cameras.filter((c) => c.deviceId === deviceId && (data.flags.channels === 2 || c.kind === 'general'));
  // AI 이벤트(mock realtime, IF-015) — 카메라별 최신 이벤트 → 타일 bbox + 배너 (AC-2)
  let events = $state<Record<string, Alert>>({});
  onMount(() =>
    data.realtime.subscribe((e) => {
      if (e.type !== 'alert.raised' || e.alert.kind !== 'ai-person' || !e.alert.cameraId) return;
      events = { ...events, [e.alert.cameraId]: e.alert };
      toast(e.alert.message);
    }),
  );
  const latest = $derived(Object.values(events).sort((a, b) => (a.at < b.at ? 1 : -1))[0]);
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A1-04']}>
  <div class="flex items-center justify-between">
    <span class="text-body-sm text-fg-muted">{data.site?.name ?? ''} · 장비 {data.devices.length}대</span>
    <Badge tone="neutral" variant="outline">프로파일 {data.flags.profile}</Badge>
  </div>
  <Tabs
    variant="pill"
    size="sm"
    {tabs}
    value={data.tab}
    onchange={(id) =>
      goto(resolve(`/a1/monitor?tab=${id}` as '/'), { keepFocus: true, noScroll: true, replaceState: true })}
  />

  {#if data.tab === 'bodycam'}
    <EmptyState
      title="바디캠 세션"
      description="현장 프로파일 옵션 {data.flags.bodycam} — 세션 목록·재생은 W4 실연동 (FR-030 · DISC-030)"
    />
  {:else}
    {#if latest}
      <Banner tone="danger">
        AI 이벤트 · {latest.message} · {fmtTime(latest.at)} — 타일에 감지 영역을 표시합니다
      </Banner>
    {/if}
    {#each data.devices as d (d.id)}
      <EquipmentCard device={d} href={resolve(`/a1/monitor/${d.id}` as '/')}>
        <div class="gap-inline-sm grid grid-cols-2">
          {#each camsOf(d.id) as c (c.id)}
            {@const ev = events[c.id]}
            <div class="gap-stack-xs flex flex-col" data-camera={c.id}>
              <div class="relative">
                <CameraTile camera={c} deviceLabel="{d.unitNo}호기" compact />
                {#if ev?.bbox}<BboxOverlay boxes={[{ ...ev.bbox, label: '사람', score: 0.91 }]} tone="danger" />{/if}
              </div>
              <HealthBadge camera={c} />
            </div>
          {/each}
        </div>
      </EquipmentCard>
    {:else}
      <EmptyState title="현장에 장비가 없습니다" />
    {/each}
  {/if}
</div>
