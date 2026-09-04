/** 클래스 결합 — falsy 제거 */
export const cx = (...parts: unknown[]) =>
  parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
export type Tone = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'progress';
export type Size = 'sm' | 'md' | 'lg';
/** tone → 유틸리티 (solid / subtle / outline) — sys.color.status.* · accent 만 사용 */
export const TONE = {
  accent: {
    solid: 'bg-accent text-accent-on-solid',
    subtle: 'bg-accent-bg text-accent-fg',
    outline: 'border-accent-border text-accent-fg',
    fg: 'text-accent-fg',
    dot: 'bg-accent',
  },
  neutral: {
    solid: 'bg-neutral text-neutral-on-solid',
    subtle: 'bg-neutral-bg text-neutral-fg',
    outline: 'border-neutral-border text-neutral-fg',
    fg: 'text-fg-muted',
    dot: 'bg-neutral',
  },
  info: {
    solid: 'bg-info text-info-on-solid',
    subtle: 'bg-info-bg text-info-fg',
    outline: 'border-info-border text-info-fg',
    fg: 'text-info-fg',
    dot: 'bg-info',
  },
  success: {
    solid: 'bg-success text-success-on-solid',
    subtle: 'bg-success-bg text-success-fg',
    outline: 'border-success-border text-success-fg',
    fg: 'text-success-fg',
    dot: 'bg-success',
  },
  warning: {
    solid: 'bg-warning text-warning-on-solid',
    subtle: 'bg-warning-bg text-warning-fg',
    outline: 'border-warning-border text-warning-fg',
    fg: 'text-warning-fg',
    dot: 'bg-warning',
  },
  danger: {
    solid: 'bg-danger text-danger-on-solid',
    subtle: 'bg-danger-bg text-danger-fg',
    outline: 'border-danger-border text-danger-fg',
    fg: 'text-danger-fg',
    dot: 'bg-danger',
  },
  progress: {
    solid: 'bg-progress text-progress-on-solid',
    subtle: 'bg-progress-bg text-progress-fg',
    outline: 'border-progress-border text-progress-fg',
    fg: 'text-progress-fg',
    dot: 'bg-progress',
  },
} as const satisfies Record<Tone, Record<string, string>>;
/** 도메인 상태 → tone (ssot domain 매핑과 동일) */
export const EQUIPMENT_TONE = {
  normal: 'success',
  caution: 'warning',
  fault: 'danger',
  offline: 'neutral',
  maintenance: 'progress',
} as const;
export const TASK_TONE = {
  new: 'info',
  assigned: 'accent',
  'in-progress': 'progress',
  done: 'success',
  escalated: 'danger',
} as const;
export const DOC_TONE = {
  valid: 'success',
  expiring: 'warning',
  submitted: 'progress',
  review: 'progress',
  approved: 'info',
  rejected: 'danger',
} as const;
export const CAMERA_TONE = {
  live: 'danger',
  snapshot: 'neutral',
  recording: 'danger',
  offline: 'neutral',
  'ai-unavailable': 'warning',
} as const;
export const SEVERITY_TONE = { critical: 'danger', warning: 'warning', info: 'info' } as const;
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';
