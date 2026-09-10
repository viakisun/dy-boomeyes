<script lang="ts">
  // 텔레메트리 요약 스트립 — 수신 상태 줄 + 통신 · 전압 · 3상 전압 · 3상 판정(FR-040) · 단선 · 고장코드 (텍스트 + warning·danger만 색, §0-4 — 점은 LIVE·REC만)
  // 미연동 계측은 '미연동'(muted) · 수신 임계 초과는 '미수신 · 마지막 HH:MM'(warning) · 두절은 마지막 값 + 시각 (FR-034 · NFR-009 · 참고자료 v5.0 §10)
  import { powerStatus, telemetryStatus, type Device, type TelemetryField } from '@boomeyes/domain';
  import { cx, type Tone } from '../lib/cx';
  import { fmtTime } from '../lib/format';
  let {
    telemetry,
    now,
    class: cls,
  }: {
    telemetry: Device['telemetry'];
    /** 화면의 DemoClock 시각(new Date() 금지 — QA §3) */ now: Date;
    class?: string;
  } = $props();
  const LTE: Record<Device['telemetry']['lte'], { tone: Tone; text: string }> = {
    connected: { tone: 'success', text: '연결' },
    weak: { tone: 'warning', text: '약함' },
    lost: { tone: 'warning', text: '두절' },
  };
  const status = $derived(telemetryStatus(telemetry, now));
  const statusText = $derived(
    status === 'ok'
      ? `수신 정상 · ${fmtTime(telemetry.at)}`
      : status === 'stale'
        ? `미수신 · 마지막 ${fmtTime(telemetry.at)}`
        : `두절 · 마지막 ${fmtTime(telemetry.at)}`,
  );
  const off = (f: TelemetryField) => telemetry.unlinked?.includes(f) ?? false;
  // 3상(FR-040) — 계측이 없거나 unlinked면 '미연동'(FR-034). 판정 문구는 DISC-056 확정 전 기준안
  const PHASE_TEXT: Record<Exclude<ReturnType<typeof powerStatus>, 'unlinked'>, string> = {
    normal: '정상',
    loss: '결상',
    reverse: '역상 — 모터 회전 방향',
    under: '단상(저전압)',
    over: '과전압',
  };
  const ps = $derived(powerStatus(telemetry.power, telemetry.unlinked));
  const phaseCell = (label: string, text: string): { label: string; tone: Tone; text: string; muted: boolean } =>
    ps === 'unlinked'
      ? { label, tone: 'neutral', text: '미연동', muted: true }
      : { label, tone: ps === 'normal' ? 'success' : 'danger', text, muted: false };
  const cell = (label: string, f: TelemetryField, tone: Tone, text: string) =>
    off(f) ? { label, tone: 'neutral' as Tone, text: '미연동', muted: true } : { label, tone, text, muted: false };
  const cells = $derived([
    cell('통신(LTE)', 'lte', LTE[telemetry.lte].tone, LTE[telemetry.lte].text),
    cell(
      '전압',
      'voltage',
      telemetry.voltageStatus === 'normal' ? 'success' : 'danger',
      `${telemetry.voltage}V · ${telemetry.voltageStatus === 'normal' ? '정상' : '이상'}`,
    ),
    phaseCell(
      '3상 전압',
      telemetry.power
        ? `R ${telemetry.power.volts.r} · S ${telemetry.power.volts.s} · T ${telemetry.power.volts.t}V`
        : '미연동',
    ),
    phaseCell('3상 판정', ps === 'unlinked' ? '미연동' : PHASE_TEXT[ps]),
    cell(
      '단선',
      'harness',
      telemetry.harness === 'ok' ? 'success' : 'danger',
      telemetry.harness === 'ok' ? '정상' : '단선',
    ),
    cell('고장코드', 'errorCode', telemetry.errorCode ? 'danger' : 'success', telemetry.errorCode ?? '없음'),
  ]);
</script>

<div class={cx('gap-stack-xs flex flex-col', cls)}>
  <p
    class={cx('text-label-sm tabular-nums', status === 'ok' ? 'text-fg-muted' : 'text-warning-fg font-medium')}
    data-telemetry-status={status}
  >
    {statusText}
  </p>
  <dl class="gap-inline-sm grid grid-cols-2" aria-label="텔레메트리">
    {#each cells as c (c.label)}
      <div class="rounded-control bg-surface-sunken p-inset-sm gap-stack-xs flex flex-col">
        <dt class="text-label-sm text-fg-muted">{c.label}</dt>
        <dd
          class={cx(
            'text-body-md font-medium',
            c.muted
              ? 'text-fg-muted'
              : c.tone === 'danger'
                ? 'text-danger-fg'
                : c.tone === 'warning'
                  ? 'text-warning-fg'
                  : 'text-fg',
          )}
          data-unlinked={c.muted || undefined}
        >
          {c.text}
        </dd>
      </div>
    {/each}
  </dl>
</div>
