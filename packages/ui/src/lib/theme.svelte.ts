// 테마 — 문서 루트 data-theme만 바꾼다(DY-design §1.3: 루트에만 · 국소 강제는 CameraWall 등 컴포넌트 내부). value null = 시스템(prefers-color-scheme)
// 웹: 탑바 토글을 localStorage('dy.theme')에 유지(app.html이 첫 페인트 전에 읽는다) · PWA: 시스템을 따르고 강제하지 않는다(§10) — ?theme=는 캡처·e2e 전용(applyTheme persist=false)
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'dy.theme';
const stored = (): Theme | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
};
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
export const theme = $state<{ value: Theme | null; system: boolean }>({
  value: typeof window === 'undefined' ? null : stored(),
  system: mq?.matches ?? false,
});
mq?.addEventListener('change', (e) => (theme.system = e.matches));

/** 루트 data-theme 적용. persist=false는 ?theme= 쿼리(캡처·e2e)용 — 저장하지 않는다 */
export function applyTheme(value: Theme | null, persist = true) {
  theme.value = value;
  if (typeof document === 'undefined') return;
  if (value) document.documentElement.dataset.theme = value;
  else delete document.documentElement.dataset.theme;
  if (!persist) return;
  try {
    if (value) localStorage.setItem(THEME_KEY, value);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* 저장 불가(프라이빗 모드) — 세션 동안만 유지 */
  }
}
export const isDark = () => (theme.value ? theme.value === 'dark' : theme.system);
export function toggleTheme() {
  applyTheme(isDark() ? 'light' : 'dark');
}
