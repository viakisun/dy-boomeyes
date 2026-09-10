<script lang="ts">
  // 시간 버킷 막대 차트(카탈로그 BarChart, Display) — 저장소 첫 차트 컴포넌트(FR-039 타설량 추세).
  // 원칙: 시각을 모른다(라벨은 호출부가 fmtTime으로 만든다 — 캡처 결정성) · 색 1개(accent, hue 증가 0 — color-audit) ·
  // hex·px 0(토큰 유틸리티 + style="height: %", B1-08 레인 전례) · 접근성 = 보이는 figcaption + sr-only 표 · 집계는 호출부.
  import { cx } from '../lib/cx';
  let {
    label,
    unit = '',
    bars,
    max,
    hint,
    markKey,
    emptyLabel = '데이터 없음',
    class: cls,
  }: {
    /** 차트 이름 — figure aria-label · sr-only 표 caption */
    label: string;
    /** 값 단위(표·캡션) */
    unit?: string;
    /** 버킷 — label은 표시 문자열(예: '10시'), value ≥ 0 */
    bars: { key: string; label: string; value: number }[];
    /** 세로 축 최댓값 — 없으면 bars의 최댓값(0이면 1) */
    max?: number;
    /** 캡션 보조 문구 */
    hint?: string;
    /** 강조할 버킷 key(예: 현재 시각) */
    markKey?: string;
    emptyLabel?: string;
    class?: string;
  } = $props();
  const top = $derived(Math.max(max ?? 0, ...bars.map((b) => b.value), 0) || 1);
  const total = $derived(bars.reduce((s, b) => s + b.value, 0));
  const peak = $derived(
    bars.reduce((m, b) => (b.value > m.value ? b : m), bars[0] ?? { key: '', label: '', value: 0 }),
  );
  // 반올림 고정 — 부동소수 꼬리로 픽셀이 흔들리지 않게(캡처 결정성)
  const pct = (v: number) => ((Math.max(0, v) / top) * 100).toFixed(1);
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
</script>

<figure class={cx('gap-stack-xs flex flex-col', cls)} aria-label={label}>
  <figcaption class="text-label-sm text-fg-muted gap-inline-sm flex flex-wrap justify-between">
    <span>{label}</span>
    {#if bars.length}
      <span class="tabular-nums"
        >합계 {fmt(total)}{unit} · 최대 {fmt(peak.value)}{unit}({peak.label}){hint ? ` · ${hint}` : ''}</span
      >
    {:else}
      <span>{emptyLabel}</span>
    {/if}
  </figcaption>
  {#if bars.length}
    <!-- 플롯은 장식 — 값은 아래 sr-only 표가 전달한다 -->
    <div class="bg-surface-sunken rounded-control p-inset-xs h-size-stat-height flex items-end" aria-hidden="true">
      {#each bars as b (b.key)}
        <div class="flex h-full flex-1 flex-col justify-end" data-bar={b.key}>
          <div
            class={cx('rounded-control w-full', b.key === markKey ? 'bg-accent' : 'bg-accent-bg-subtle')}
            style="height: {pct(b.value)}%"
          ></div>
        </div>
      {/each}
    </div>
    <div class="text-label-sm text-fg-muted flex justify-between tabular-nums" aria-hidden="true">
      <span>{bars[0]!.label}</span>
      {#if bars.length > 2}<span>{bars[Math.floor(bars.length / 2)]!.label}</span>{/if}
      <span>{bars[bars.length - 1]!.label}</span>
    </div>
    <table class="sr-only">
      <caption>{label}{unit ? ` (${unit})` : ''}</caption>
      <thead><tr><th scope="col">구간</th><th scope="col">값</th></tr></thead>
      <tbody>
        {#each bars as b (b.key)}
          <tr><th scope="row">{b.label}</th><td>{fmt(b.value)}{unit}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</figure>
