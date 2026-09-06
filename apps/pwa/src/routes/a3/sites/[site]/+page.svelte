<script lang="ts">
  // A3-03 현장 상세(본사) — 현장 요약 Stat 4(장비·이상·미처리 업무·서류 완비율) · 기본정보 · 미처리 업무 "확인 요청"만(처리 버튼 없음, DISC-015) · 장비 열람(A3-04) 링크 — A1과 공통 컴포넌트 + 역할별 액션 슬롯 교체 (specs/sites-assets-leases AC-7)
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR, profileFlags, type Case } from '@boomeyes/domain';
  import {
    Badge,
    Button,
    EmptyState,
    KeyValueList,
    Stat,
    StatusPill,
    TASK_LABEL,
    TASK_TONE,
    dueLabel,
    toast,
    StatGroup,
  } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  const now = $derived(data.clock.now());
  const abnormal = $derived(data.devices.filter((d) => d.state !== 'normal').length);
  const open = $derived(data.cases.filter((c) => c.state !== 'done'));
  const safety = $derived(data.users.find((u) => u.id === data.site.safetyUserId)?.display ?? data.site.safetyUserId);
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

<div class="gap-stack-lg pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A3-03']} data-abnormal={abnormal}>
  <a href={resolve('/a3/sites' as '/')} class="text-label-md text-accent-fg">‹ 현장 목록</a>
  <div class="gap-stack-xs flex flex-col">
    <div class="flex items-center justify-between">
      <h2 class="text-heading-md">{data.site.name}</h2>
      <Badge tone="neutral" variant="outline"
        ><span data-profile={data.site.videoProfile}>{profileFlags(data.site.videoProfile).channels}채널</span></Badge
      >
    </div>
    <span class="text-body-sm text-fg-muted" data-ref="DISC-015"
      >{data.site.id} · {data.site.company} · 열람 전용(확인 요청만)</span
    >
  </div>
  <StatGroup label="현장 요약">
    <Stat label="장비" value={data.devices.length} unit="대" />
    <Stat
      label="이상"
      value={abnormal}
      unit="대"
      tone={abnormal ? 'danger' : 'neutral'}
      hint={abnormal ? '주의·고장·두절·정비' : '전 호기 정상'}
    />
    <Stat
      label="미처리 업무"
      value={open.length}
      unit="건"
      tone={open.some((c) => c.state === 'escalated') ? 'danger' : open.length ? 'warning' : 'neutral'}
      hint="에스컬레이션 {open.filter((c) => c.state === 'escalated').length}"
    />
    <Stat
      label="서류 완비율"
      value={data.docs?.rate ?? 0}
      unit="%"
      tone={(data.docs?.rate ?? 0) === 100 ? 'neutral' : 'warning'}
      hint={data.docs ? `${data.docs.complete}/${data.docs.total}` : '서류 없음'}
    />
  </StatGroup>
  <KeyValueList
    label="현장 기본정보"
    items={[
      { label: '주소', value: data.site.address },
      { label: '기간', value: data.site.period ? `${data.site.period.from} ~ ${data.site.period.to}` : '미정' },
      { label: '현장 안전관리자', value: safety },
    ]}
  />
  <a href={resolve(`/a3/sites/${data.site.id}/devices` as '/')} class="text-body-md text-accent-fg"
    >장비 열람 — 카메라 타일 ›</a
  >
  <section class="gap-stack-sm flex flex-col" aria-label="업무">
    <h2 class="text-heading-md">미처리 업무 {open.length}</h2>
    {#if open.length}
      <ul class="gap-stack-xs flex flex-col" aria-label="미처리 업무">
        {#each open as c (c.id)}
          <li
            class="rounded-card border-border bg-surface p-inset-md gap-stack-xs flex flex-col border"
            data-case={c.id}
          >
            <div class="flex items-center justify-between">
              <span class="text-label-md text-fg-muted">{c.id} · 기한 {dueLabel(c.dueAt, now).label}</span>
              <StatusPill tone={TASK_TONE[c.state]} label={TASK_LABEL[c.state]} size="sm" />
            </div>
            <span class="text-body-md">{c.title}</span>
            <div class="flex justify-end">
              <Button size="sm" variant="outline" tone="neutral" disabled={busy === c.id} onclick={() => confirm(c)}
                >확인 요청</Button
              >
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <EmptyState title="미처리 업무가 없습니다" />
    {/if}
  </section>
</div>
