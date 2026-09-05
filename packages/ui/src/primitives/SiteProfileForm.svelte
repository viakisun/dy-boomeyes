<script lang="ts">
  // 현장 프로파일(카탈로그 SiteProfileForm, DISC-028) — 프리셋 3 전환 · 옵션 8축 표시(축 편집은 W4 · FR-029) · 개인정보 표준 패키지(FR-031)
  import { PROFILE_IDS, profileAxes, profileFlags, type Site, type VideoProfile } from '@boomeyes/domain';
  import Button from './Button.svelte';
  import KeyValueList from './KeyValueList.svelte';
  import Select from './Select.svelte';
  let {
    site,
    preset = $bindable(site.videoProfile),
    busy = false,
    onapply,
  }: { site: Site; preset?: VideoProfile; busy?: boolean; onapply?: (preset: VideoProfile) => void } = $props();
  const axes = $derived(profileAxes(preset));
  const flags = $derived(profileFlags(preset));
  const dirty = $derived(preset !== site.videoProfile);
</script>

<div class="gap-stack-md flex flex-col" data-profile-form={site.id}>
  <Select
    label="프리셋"
    value={preset}
    options={PROFILE_IDS.map((p) => ({ value: p, label: p }))}
    onchange={(e) => (preset = e.currentTarget.value as VideoProfile)}
  />
  <p class="text-body-sm text-fg-muted">
    채널 {flags.channels} · 저장 {flags.sources.join(' · ')} · 스냅샷 {flags.snapshotEveryMs / 1000}s
    {#if dirty}<span class="text-warning-fg">— 적용 전(현재 {site.videoProfile})</span>{/if}
  </p>
  <KeyValueList
    label="옵션 8축"
    items={axes.map((a) => ({ label: `${a.id} ${a.name}`, value: a.choice ?? '없음', muted: !a.choice }))}
  />
  <div class="gap-inline-sm flex flex-wrap">
    <Button disabled={!dirty || busy} onclick={() => onapply?.(preset)}>적용</Button>
    <Button variant="outline" tone="neutral" disabled title="축 개별 편집은 W4 (FR-029)">축 편집 — W4 · FR-029</Button>
  </div>
  <p class="text-label-sm text-fg-muted">
    개인정보(AX-7)는 표준 패키지(DY 제공, FR-031) · 보존/홀드·열람 로그는 W4 · 카탈로그·프로파일 등록 방식은 DISC-028
  </p>
</div>
