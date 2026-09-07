<script lang="ts">
  // 브랜드 마크(DY-design §13) — mark(≥ 32px, 6엽 조리개) · glyph(≤ 24px, 육각 링) · lockup(마크 + 워드마크).
  // 셸(사이드바·앱바·인쇄)은 단색(currentColor). 두 톤(color)은 로그인·앱 아이콘·문서 표지에만 — 붐·"Eyes"가 accent.fg.
  // 패스 원천은 packages/tokens/src/logo.json(tools/brand). label이 있으면 role=img, 없으면 장식(aria-hidden).
  import logo from '@boomeyes/tokens/logo';
  import { cx } from '../lib/cx';
  let {
    variant = 'mark',
    color = false,
    label,
    class: cls,
  }: { variant?: 'mark' | 'glyph' | 'lockup'; color?: boolean; label?: string; class?: string } = $props();
  const v = $derived(logo[variant]);
</script>

<svg
  viewBox={v.viewBox}
  class={cx('shrink-0', cls)}
  data-logo={variant}
  data-color={color || undefined}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  focusable="false"
>
  {#each v.ink as d (d)}<path {d} fill="currentColor" />{/each}
  {#each v.accent as d (d)}<path {d} fill="currentColor" class={color ? 'fill-accent-fg' : undefined} />{/each}
</svg>
