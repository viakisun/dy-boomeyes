// 토스트 스토어 — 최대 3개 · 자동 닫힘 (QA: 하단 PWA · 우하단 웹)
import type { Tone } from '../lib/cx';
export interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
  action?: { label: string; onclick: () => void };
  timeout: number;
}
let seq = 0;
export const toasts = $state<ToastItem[]>([]);
export function toast(message: string, opts: Partial<Omit<ToastItem, 'id' | 'message'>> = {}) {
  const item: ToastItem = {
    id: ++seq,
    tone: opts.tone ?? 'neutral',
    message,
    action: opts.action,
    timeout: opts.timeout ?? 4000,
  };
  toasts.push(item);
  while (toasts.length > 3) toasts.shift();
  if (item.timeout > 0) setTimeout(() => dismiss(item.id), item.timeout);
  return item.id;
}
export function dismiss(id: number) {
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts.splice(i, 1);
}
