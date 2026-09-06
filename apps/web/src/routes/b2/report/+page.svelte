<script lang="ts">
  // B2-04 보고 모드 — 현장별 요약(장비·이상·업무 처리율·점검 제출률·서류 완비율·에스컬레이션·알림) · 기간 7/30일(DemoClock) · ESC/바깥 클릭 → B2-02 · PDF는 비활성(API-014 2단계) · role=document 열람 전용 (specs/records-reports AC-4 · FR-023)
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { SCR } from '@boomeyes/domain';
  import { Badge, Button, PageHeader, Stat, Tabs } from '@boomeyes/ui';
  let { data } = $props();
  const TABS = [
    { id: '7', label: '7일' },
    { id: '30', label: '30일' },
  ];
  const back = () => goto(resolve('/b2/map' as '/'));
  // 기간 전환은 다른 쿼리(?state= ?capture=)를 유지한다(QA §3)
  const pick = (id: string) => {
    const u = new URL(location.href);
    u.searchParams.set('days', id);
    goto(resolve((u.pathname + u.search) as '/'), { keepFocus: true, noScroll: true, replaceState: true });
  };
  const total = $derived(data.report.reduce((a, s) => a + s.devices, 0));
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && back()} />

<div
  class="gap-stack-lg min-h-layout-panel-height flex flex-col"
  role="document"
  aria-label="보고 모드"
  data-scr={SCR['B2-04']}
  data-days={data.days}
  onclick={(e) => e.target === e.currentTarget && back()}
>
  <PageHeader
    title="보고 모드"
    description="자사 현장 {data.report.length} · CPB {total}대 · 열람 전용 — ESC 또는 바깥 클릭으로 닫습니다"
  >
    {#snippet actions()}
      <Button variant="outline" tone="neutral" disabled title="다음 단계에서 지원합니다" data-ref="API-014"
        >PDF 내보내기 — 준비 중</Button
      >
      <Button variant="ghost" tone="neutral" onclick={back}>닫기 (Esc)</Button>
    {/snippet}
    <Tabs tabs={TABS} value={String(data.days)} variant="pill" size="sm" onchange={pick} />
  </PageHeader>
  {#each data.report as s (s.siteId)}
    <section
      class="gap-stack-sm rounded-card border-border bg-surface p-inset-lg flex flex-col border"
      data-site={s.siteId}
      aria-label={s.site}
    >
      <div class="flex items-center justify-between">
        <h2 class="text-heading-md">{s.site}</h2>
        <Badge tone={s.abnormal ? 'danger' : 'success'}>{s.abnormal ? `이상 ${s.abnormal}` : '전 호기 정상'}</Badge>
      </div>
      <div class="gap-inline-md grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="장비" value={s.devices} unit="대" tone="neutral" hint="이상 {s.abnormal}" />
        <Stat
          label="업무 처리율"
          value={s.caseRate}
          unit="%"
          tone={s.caseRate === 100 ? 'success' : 'warning'}
          hint="{s.casesDone}/{s.casesTotal}건"
        />
        <Stat
          label="점검 제출률"
          value={s.inspectionRate}
          unit="%"
          tone={s.inspectionRate === 100 ? 'success' : 'warning'}
          hint="제출 {s.inspections}건"
        />
        <Stat
          label="서류 완비율"
          value={s.docRate}
          unit="%"
          tone={s.docRate === 100 ? 'success' : 'warning'}
          hint="서류 {s.docTotal}건 · 현재 기준"
        />
        <Stat label="에스컬레이션" value={s.escalated} unit="건" tone={s.escalated ? 'danger' : 'success'} />
        <Stat label="알림" value={s.alerts} unit="건" tone="info" hint="{s.days}일" />
      </div>
    </section>
  {/each}
</div>
