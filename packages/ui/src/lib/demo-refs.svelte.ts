// 시연 모드 "근거" 토글 — 문서 루트 data-demo-refs가 켜지면 [data-ref] 요소 뒤에 SSOT ID 칩이 보인다(DemoBar.svelte의 :global CSS)
// 화면 문자열에는 ID를 쓰지 않는다(DY-design §12.1-2): 근거는 data-ref 속성(공백 구분 ID)에만
export const demoRefs = $state({ on: false });
export function applyDemoRefs(on: boolean) {
  demoRefs.on = on;
  if (typeof document === 'undefined') return;
  if (on) document.documentElement.dataset.demoRefs = '';
  else delete document.documentElement.dataset.demoRefs;
}
