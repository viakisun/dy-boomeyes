<script lang="ts">
  // AI 오버레이 — 정규화 좌표(0~1). 텍스트 대체(sr-only) 필수 (video-basics 접근성)
  // 상자는 두 갈래다: 탐지(object)는 프레임마다 움직이고, 구역(zone)은 카메라 보정값이라 고정이다.
  // 구역은 파선에 옅은 면으로 그려 「지금 본 것」이 아니라 「정해 둔 경계」임을 형태로 말한다.
  // 사각형만 SVG(preserveAspectRatio=none)로 그리고 이름표는 HTML로 얹는다 —
  // 늘어난 좌표계 안의 <text>는 글자가 가로로 늘어나고 토큰 서체를 쓰지 못한다.
  export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
    score?: number;
    /** object = 탐지 결과(기본) · zone = 접근 주의 구역(보정값) */
    kind?: 'object' | 'zone';
    /** 상자별 톤 — 없으면 오버레이의 tone을 따른다 */
    tone?: 'warning' | 'danger';
  }
  let { boxes = [], tone = 'warning' }: { boxes?: Box[]; tone?: 'warning' | 'danger' } = $props();
  const toneOf = (b: Box) => b.tone ?? tone;
  // 토큰 이름은 sys.color.status.<톤>.solid다 — 예전 코드의 `--sys-color-danger-solid`는 없는 변수라
  // 선이 검정으로 떨어지고 있었다(a1/monitor의 상자 포함).
  const stroke = (b: Box) =>
    toneOf(b) === 'danger' ? 'var(--sys-color-status-danger-solid)' : 'var(--sys-color-status-warning-solid)';
  const chip = (b: Box) =>
    toneOf(b) === 'danger' ? 'bg-danger text-danger-on-solid' : 'bg-warning text-warning-on-solid';
  const zoneOf = (b: Box) => b.kind === 'zone';
  const text = (b: Box) => `${b.label ?? '객체'}${b.score !== undefined ? ` ${b.score.toFixed(2)}` : ''}`;
  // 상자가 프레임 위쪽에 붙어 있으면 이름표를 위에 둘 자리가 없다 — 그럴 땐 상자 안쪽으로 넣는다
  // (구 SVG는 y를 4%로 클램프해 프레임 안에 두었다. 같은 보호를 유지한다.)
  const inside = (b: Box) => zoneOf(b) || b.y * 100 < 6;
</script>

{#if boxes.length}
  <div class="pointer-events-none absolute inset-0">
    <!-- data-bbox는 svg에 남긴다 — 기존 화면의 e2e가 `svg[data-bbox] rect`로 상자를 센다 -->
    <svg
      class="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-bbox
    >
      {#each boxes as b, i (i)}
        <rect
          x={b.x * 100}
          y={b.y * 100}
          width={b.w * 100}
          height={b.h * 100}
          fill={zoneOf(b) ? stroke(b) : 'none'}
          fill-opacity={zoneOf(b) ? 0.12 : 0}
          stroke={stroke(b)}
          stroke-width={zoneOf(b) ? 1.2 : 0.8}
          stroke-dasharray={zoneOf(b) ? '2 1.5' : undefined}
          vector-effect="non-scaling-stroke"
          data-box={b.kind ?? 'object'}
        />
      {/each}
    </svg>
    {#each boxes as b, i (i)}
      <!-- 구역 이름표는 상자 안쪽 위, 탐지 이름표는 상자 위 — 서로도 프레임 캡션과도 부딪히지 않게 -->
      <span
        aria-hidden="true"
        class="rounded-control px-inset-xs text-label-sm absolute whitespace-nowrap {chip(b)}"
        style:left="{b.x * 100}%"
        style:top="{b.y * 100}%"
        style:transform={inside(b) ? 'translateY(2%)' : 'translateY(-110%)'}>{text(b)}</span
      >
    {/each}
  </div>
  <span class="sr-only">
    {#each boxes as b, i (i)}{text(b)}
      {i + 1}.
    {/each}
  </span>
{/if}
