// demo-scripts 장면 재생(PWA): 장면 2·3 진입·흐름 · 장면 5·7의 W2 자리 화면 · 장면 바 (specs/demo-scripts AC-2 AC-3 AC-7)
import { expect, test } from '@playwright/test';
import { SCR, SCREENS } from '../../packages/domain/src/generated/ids';

const root = (scr: string) => `[data-scr="${scr}"]`;

test('[A2-02] 장면 2: driver03 세션 · 미체크인 · E-021 알림 → 대응 안내 → 체크인 → 근무 중 [FR-011] [FR-013]', async ({
  page,
}) => {
  await page.goto('/a2/today?scene=2');
  await expect(page.locator(root(SCR['A2-02']))).toBeVisible();
  await expect(page.locator('[data-demo-bar]')).toContainText('장면 2/11');
  await expect(page.locator('[data-demo-bar]')).toContainText('운전자 인지');
  await page.getByRole('button', { name: /E-021/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('대응 안내');
  await dialog.getByRole('button', { name: '확인' }).click();
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.getByText(/근무 중/)).toBeVisible();
});

test('[A2-03] 장면 2: 체크인 후 점검 5항목 제출 → 제출 완료 (db가 장면 안에서 유지) [FR-014]', async ({ page }) => {
  await page.goto('/a2/today?scene=2');
  await page.getByRole('button', { name: '출근 체크인' }).click();
  await expect(page.getByText(/근무 중/)).toBeVisible();
  await page.getByRole('button', { name: '점검하기' }).click();
  await expect(page.locator(root(SCR['A2-03']))).toBeVisible();
  const boxes = page.getByRole('checkbox');
  await expect(boxes).toHaveCount(5);
  for (let i = 0; i < 5; i++) await boxes.nth(i).check();
  await page.getByRole('button', { name: '점검 제출' }).click();
  await expect(page.getByText('제출 완료', { exact: true })).toBeVisible();
});

test('[A1-02] 장면 3: safety01 세션 · C-105 접수 → 진행 중 · 정비 담당 호출 · 다음 → 장면 4(웹) [FR-008] [FR-006]', async ({
  page,
}) => {
  await page.goto('/a1/inbox?scene=3');
  await expect(page.locator(root(SCR['A1-02']))).toBeVisible();
  await page.locator('ul[aria-label="업무"] li a').first().click(); // 정렬 최상단 C-105
  await expect(page.locator(root(SCR['A1-03']))).toBeVisible();
  await page.getByRole('button', { name: '접수', exact: true }).click();
  await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '정비 담당 호출' }).click();
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('정비 담당 호출');
  await expect(page.locator('[data-demo-bar]').getByRole('link', { name: '다음 →' })).toHaveAttribute(
    'href',
    /4173\/b1\/dash\?scene=4$/,
  );
});

test('[A1-03] 장면 5: 정비 호출 이력이 있는 C-105(진행 중) · 완료 확인 → A1-08 시트 · 완료 확인 → 기록(A1-06) 최상단에 조치 행 [FR-008] [FR-024]', async ({
  page,
}) => {
  await page.goto('/a1/inbox/C-105?scene=5');
  await expect(page.locator(root(SCR['A1-03']))).toBeVisible();
  await expect(page.locator('ol[aria-label="이력"]')).toContainText('정비 담당 호출');
  await expect(page.getByRole('button', { name: '완료 확인' })).toBeVisible();
  await page.goto(`${SCREENS['A1-08'].route.replace('[case]', 'C-105')}&scene=5`); // /a1/inbox/C-105?sheet=complete — A1-03 위 시트
  await expect(page.locator(root(SCR['A1-08'])).first()).toBeVisible();
  await expect(page.locator('dialog[open][data-bottom-sheet]')).toContainText('완료 처리');
  // 완료 처리(조치 내용 필수) → 앱 내 이동으로 기록 탭 — 장면 db가 유지되어 완료 확인 행이 최상단(AC-2)
  await page.getByLabel('조치 내용(필수)').fill('전압 릴레이 교체');
  await page.locator('dialog[open]').getByRole('button', { name: '완료 확인' }).click(); // 하단 바에도 같은 이름의 버튼
  await expect(page.getByText('완료 상태 — 할 일이 없습니다')).toBeVisible();
  await page.getByRole('navigation', { name: '하단 내비게이션' }).getByRole('link', { name: '기록' }).click();
  await expect(page.locator(root(SCR['A1-06']))).toBeVisible();
  const rows = page.locator('ol[aria-label="기록"] li');
  await expect(rows.first()).toContainText('완료 확인');
  await expect(rows.first()).toContainText('전압 릴레이 교체');
  await expect(page.locator('[data-demo-bar]')).toContainText('장면 5/11');
});

test('[A2-05] 장면 7: 내 서류(DOC-001 D-27 촬영·제출 액션) · 장면 바 이전(장면 6 웹)/다음(장면 8 웹) [FR-015] [FR-024]', async ({
  page,
}) => {
  await page.goto('/a2/docs?scene=7');
  await expect(page.locator(root(SCR['A2-05']))).toBeVisible();
  await expect(page.locator('[data-doc="DOC-001"]').getByRole('button', { name: '촬영·제출' })).toBeVisible();
  const bar = page.locator('[data-demo-bar]');
  await expect(bar.getByRole('link', { name: '← 이전' })).toHaveAttribute('href', /4173\/b1\/escalation\?scene=6$/);
  await expect(bar.getByRole('link', { name: '다음 →' })).toHaveAttribute('href', /4173\/b4\/protocols\?scene=8$/);
});
