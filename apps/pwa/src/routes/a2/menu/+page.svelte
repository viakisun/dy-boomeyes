<script lang="ts">
  // A2-06 메뉴·현장 정보(운전자) — 배정 현장 기본정보 · 배정 장비 · 동의 요약(FR-031 표준 패키지) · 정비 연락처 · 앱 정보 — 편집 액션 없음 (specs/sites-assets-leases AC-6)
  import { version } from '$app/environment';
  import { ROLE_NAME, SCR, profileFlags } from '@boomeyes/domain';
  import { Badge, CONSENT_LABEL, EmptyState, EquipmentCard, KeyValueList } from '@boomeyes/ui';
  let { data } = $props();
  const t = $derived(data.today);
  const flags = $derived(t.site ? profileFlags(t.site.videoProfile) : null);
</script>

<div class="gap-stack-lg pb-layout-bottomnav-height flex flex-col" data-scr={SCR['A2-06']}>
  {#if t.site}
    <section class="gap-stack-sm flex flex-col" aria-label="현장 기본정보">
      <div class="flex items-center justify-between">
        <h2 class="text-heading-md">{t.site.name}</h2>
        <Badge tone="neutral" variant="outline">프로파일 {t.site.videoProfile}</Badge>
      </div>
      <KeyValueList
        label="현장 기본정보"
        items={[
          { label: '현장', value: `${t.site.id} · ${t.site.company}` },
          { label: '주소', value: t.site.address },
          { label: '기간', value: t.site.period ? `${t.site.period.from} ~ ${t.site.period.to}` : '미정' },
          { label: '현장 안전관리자', value: data.safety?.display ?? t.site.safetyUserId },
          {
            label: '정비 담당',
            value: t.maintenance ? `${t.maintenance.display} · ${t.maintenance.phone ?? '—'}` : '—',
          },
          { label: '영상', value: flags ? `${flags.channels}채널 · 촬영 ${t.filming ? '중' : '아님'}` : '—' },
        ]}
      />
    </section>
  {:else}
    <EmptyState title="배정 현장이 없습니다" />
  {/if}
  <section class="gap-stack-sm flex flex-col" aria-label="배정 장비">
    <h2 class="text-heading-md">배정 장비</h2>
    {#if t.device}
      <EquipmentCard device={t.device} summary class="rounded-card border-border bg-surface p-inset-md border" />
    {:else}
      <EmptyState title="배정 장비가 없습니다" />
    {/if}
  </section>
  <section class="gap-stack-sm flex flex-col" aria-label="동의 요약">
    <h2 class="text-heading-md">개인정보 동의</h2>
    <div class="gap-inline-sm flex flex-wrap" aria-label="동의 항목">
      {#each t.consent.items as c (c.kind)}
        <Badge tone={c.agreed ? 'success' : 'neutral'} variant="outline"
          >{CONSENT_LABEL[c.kind]} 동의 {c.agreed ? '✓' : '✗'}</Badge
        >
      {/each}
    </div>
    <p class="text-label-sm text-fg-muted">
      표준 패키지(DY 제공, FR-031) — 변경은 현장 안전관리자에게 요청 · 보존/홀드·열람 로그는 W4
    </p>
  </section>
  <section class="gap-stack-sm flex flex-col" aria-label="앱 정보">
    <h2 class="text-heading-md">앱 정보</h2>
    <KeyValueList
      items={[
        { label: '계정', value: `${t.user.display} (${t.user.id})` },
        { label: '역할', value: ROLE_NAME[t.user.role] },
        { label: '앱', value: `BoomEyes 운전자 앱 v${version}` },
      ]}
    />
  </section>
</div>
