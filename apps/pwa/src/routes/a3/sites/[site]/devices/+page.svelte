<script lang="ts">
  // A3-04 장비 열람(본사) — A1-04와 같은 타일·헬스 배지, 처리 액션 없음 · AI 채널은 현장 프로파일(AX-1) (specs/video-basics AC-9 · DISC-015)
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import { Badge, EmptyState, EquipmentCard } from '@boomeyes/ui';
  import { CameraTile, HealthBadge } from '@boomeyes/video';
  let { data } = $props();
  const camsOf = (deviceId: string) =>
    data.cameras.filter((c) => c.deviceId === deviceId && (data.flags.channels === 2 || c.kind === 'general'));
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A3-04']}>
  <a href={resolve(`/a3/sites/${data.site.id}` as '/')} class="text-label-md text-accent-fg">‹ 현장 상세</a>
  <div class="flex items-center justify-between">
    <span class="text-body-sm text-fg-muted">{data.site.name} · 장비 {data.devices.length}대 · 열람 전용</span>
    <Badge tone="neutral" variant="outline"
      ><span data-profile={data.flags.profile}>{data.flags.channels}채널</span></Badge
    >
  </div>
  {#if data.devices.length}
    {#each data.devices as d (d.id)}
      <EquipmentCard device={d}>
        <div class="gap-inline-sm grid grid-cols-2">
          {#each camsOf(d.id) as c (c.id)}
            <div class="gap-stack-xs flex flex-col" data-camera={c.id}>
              <CameraTile camera={c} deviceLabel="{d.unitNo}호기" compact status={false} />
              <HealthBadge camera={c} />
            </div>
          {/each}
        </div>
      </EquipmentCard>
    {/each}
  {:else}
    <EmptyState title="장비가 없습니다" description="이 현장에 배정된 호기가 없습니다." />
  {/if}
</div>
