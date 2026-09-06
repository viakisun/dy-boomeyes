<script lang="ts">
  // B1-07 쇼케이스 — 화면 루트 data-theme=dark 강제(ShowcaseOverlay) · 지표 4(무사고 D+ · 점검 제출률 · 서류 완비율 · 24시간 알림) · 카메라 월 라이브 · 현장 카드(이름·연락처 마스킹) · 처리·편집 액션 0 · ESC/클릭 → B1-02 · 마스킹 정책 미확정(DISC-031) (specs/owner-showcase AC-1~3 · FR-023 · 장면 10)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import { Badge, ShowcaseOverlay, Stat, fmtDateTime, StatGroup } from '@boomeyes/ui';
  import { CameraWall } from '@boomeyes/video';
  let { data } = $props();
  const s = $derived(data.showcase);
  const back = () => goto(resolve('/b1/dash' as '/'));
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && back()} />

<div class="flex min-w-0 flex-col" data-scr={SCR['B1-07']} onclick={back} role="presentation">
  <ShowcaseOverlay
    label="관제 쇼케이스"
    watermark="읽기 전용 · 개인정보 마스킹 · 처리 액션 없음"
    note="ESC 또는 화면 클릭으로 관제 대시보드로"
    ref="DISC-031"
  >
    <div class="gap-inline-md flex flex-wrap items-end justify-between">
      <div class="gap-stack-xs flex flex-col">
        <span class="text-label-md text-fg-muted">BoomEyes · CPB 안전관제 쇼케이스</span>
        <h1 class="text-heading-xl">현장 {s.sites.length} · CPB {s.devices}대 가동 {s.normal}대</h1>
        <span class="text-body-sm text-fg-muted">{fmtDateTime(data.clock.iso())} · 실시간 · 시연용 대체 영상</span>
      </div>
      <Badge tone="success" variant="solid">안전관리 중</Badge>
    </div>
    <StatGroup label="지표">
      <Stat label="무사고" value="D+{s.daysWithoutAccident}" hint="현장 개설일 기준 · 사고 기록 없음" />
      <Stat
        label="점검 제출률"
        value={s.inspectionRate}
        unit="%"
        tone={s.inspectionRate === 100 ? 'neutral' : 'warning'}
        hint="오늘 · 호기 기준"
      />
      <Stat
        label="서류 완비율"
        value={s.docRate}
        unit="%"
        tone={s.docRate === 100 ? 'neutral' : 'warning'}
        hint="유효·승인 / 전체"
      />
      <Stat label="24시간 알림" value={s.alerts24h} unit="건" hint="긴급·경고·정보" />
    </StatGroup>
    <CameraWall cameras={data.cameras} devices={data.devices} sites={data.sites} title="카메라 월 라이브" />
    <section class="gap-inline-md grid md:grid-cols-2" aria-label="현장">
      {#each s.sites as site (site.id)}
        <div
          class="rounded-card border-border bg-surface p-inset-md gap-stack-xs flex flex-col border"
          data-site={site.id}
        >
          <div class="flex items-center justify-between">
            <span class="text-heading-sm">{site.name}</span>
            <Badge tone={site.abnormal ? 'warning' : 'success'}
              >{site.abnormal ? `이상 ${site.abnormal}` : '전 호기 정상'}</Badge
            >
          </div>
          <span class="text-body-sm text-fg-muted"
            >{site.company} · CPB {site.devices}대 · 무사고 D+{site.daysWithoutAccident}</span
          >
          <span class="text-body-sm">현장 안전관리자 {site.safety} · 임대인 {site.contact}</span>
        </div>
      {/each}
    </section>
  </ShowcaseOverlay>
</div>
