// [B4-03] 장비·현장·프로파일 · [B4-04] 사용자·권한 (specs/sites-assets-leases AC-1 · AC-2)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B4-03] 장비 탭: 호기 5 · CPB-005 → SITE-001 배정 · 호기 3 등록은 중복 오류 · 호기 6 등록 → 6대 [FR-018]', async ({
  page,
}) => {
  await page.goto('/b4/assets?state=assets&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-03']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(5);
  await rows.filter({ hasText: 'CPB-005' }).click();
  const aside = page.getByRole('complementary', { name: '장비 상세' });
  await expect(aside).toContainText('CPB-005 · 5호기');
  await expect(aside).toContainText('대전 B 물류센터');
  await aside.getByLabel('배정 현장').selectOption('SITE-001');
  await aside.getByRole('button', { name: '배정' }).click();
  await expect(page.getByRole('status').filter({ hasText: '배정 — CPB-005 → 한빛 초등학교 건설 현장' })).toBeVisible();
  await expect(rows.filter({ hasText: 'CPB-005' })).toContainText('한빛 초등학교 건설 현장');
  const form = page.getByRole('form', { name: '호기 등록' });
  await form.getByLabel('호기(1~120)').fill('3');
  await form.getByLabel('현장').selectOption('SITE-002');
  await form.getByRole('button', { name: '등록' }).click();
  await expect(page.getByRole('status').filter({ hasText: '호기 3 중복' })).toBeVisible();
  await expect(rows).toHaveCount(5);
  await form.getByLabel('호기(1~120)').fill('6');
  await form.getByRole('button', { name: '등록' }).click();
  await expect(page.getByRole('status').filter({ hasText: '등록 — CPB-006 6호기' })).toBeVisible();
  await expect(rows).toHaveCount(6);
  await expect(rows.filter({ hasText: 'CPB-006' })).toContainText('두절');
});

test('[B4-03] 현장 탭: 기간·안전관리자 편집 저장 · 현장 등록 → SITE-003 · 프로파일 탭 전환은 state·capture 유지(새로고침에도 유지) → P-LITE 적용 → 미리보기 월 1채널(AX-1) · 축 편집 비활성 [FR-018] [FR-029]', async ({
  page,
}) => {
  await page.goto('/b4/assets?tab=sites&state=assets&capture=1');
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('2026-03-01 ~ 2026-12-31');
  const edit = page.getByRole('form', { name: '현장 편집' });
  await expect(edit.getByRole('button', { name: '저장' })).toBeDisabled();
  await edit.getByLabel('기간 종료').fill('2027-03-31');
  await edit.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '저장 — 한빛 초등학교 건설 현장' })).toBeVisible();
  await expect(rows.first()).toContainText('2026-03-01 ~ 2027-03-31');
  const create = page.getByRole('form', { name: '현장 등록' });
  await create.getByLabel('현장명').fill('세종 C 아파트');
  await create.getByLabel('주소').fill('세종특별자치시 나성동 1');
  await create.getByLabel('담당 안전관리자').selectOption('safety01');
  await create.getByRole('button', { name: '등록' }).click();
  await expect(page.getByRole('status').filter({ hasText: '등록 — 세종 C 아파트' })).toBeVisible();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(2)).toContainText('SITE-003');

  await page.getByRole('tab', { name: '프로파일' }).click();
  await expect(page).toHaveURL(/tab=profiles/);
  // 탭 전환이 기존 쿼리(state·capture)를 지우지 않는지(화면 검수 F-16) — 지우면 새로고침 시 로그인으로 튕긴다
  await expect(page).toHaveURL(/state=assets/);
  await expect(page).toHaveURL(/capture=1/);
  await page.reload();
  await expect(page.locator(`[data-scr="${SCR['B4-03']}"]`)).toBeVisible();
  await expect(page.locator('figure img[alt*="설치 구성도"]')).toHaveCount(1); // 장착 위치(ENT-04) · 설치 구성도(참고자료 v5.0 §8)
  await expect(page.getByRole('complementary', { name: '프로파일 요약' })).toContainText('본체·1번 관절 인근');
  await expect(page.getByLabel('현장')).toHaveValue('SITE-001');
  const wall = page.locator('[data-wall] button[aria-label*="카메라"]');
  await expect(wall).toHaveCount(6); // P-SD 2채널 × 3대
  await expect(page.getByRole('button', { name: /축 편집/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: '적용' })).toBeDisabled();
  await page.getByLabel('프리셋').selectOption('P-LITE');
  await expect(page.locator('dl[aria-label="옵션 8축"]')).toContainText('1채널');
  await page.getByRole('button', { name: '적용' }).click();
  await expect(page.getByRole('status').filter({ hasText: '프로파일 — 한빛 초등학교 건설 현장 P-LITE' })).toBeVisible();
  await expect(wall).toHaveCount(3); // 1채널 — 일반 채널만 (B1-02 · A1-04와 같은 visibleIn)
  await expect(page.getByRole('complementary', { name: '프로파일 요약' })).toContainText('1채널');
});

test('[B4-04] 계정 7 · 역할 변경(site-safety 비활성) → 접근 화면 즉시 반영 · 현장 범위 저장 · 상태 정지 [FR-021] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b4/users?state=users&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B4-04']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(7);
  await rows.filter({ hasText: 'maint01' }).click();
  await expect(page).toHaveURL(/user=maint01/);
  const aside = page.getByRole('complementary', { name: '사용자 상세' });
  await expect(aside).toContainText('정정비');
  const role = aside.getByLabel('역할');
  await expect(role.locator('option[value="site-safety"]')).toHaveAttribute('disabled', ''); // Playwright toBeDisabled는 option을 컨트롤로 보지 않는다
  const access = aside.getByText(/접근 화면/).locator('xpath=following-sibling::dd[1]');
  await expect(access).not.toContainText('A3-02'); // 정비 담당은 본사 앱 화면 없음
  await role.selectOption('hq-safety');
  await expect(page.getByRole('status').filter({ hasText: '역할 — 정정비 → 본사 안전관리자' })).toBeVisible();
  await expect(rows.filter({ hasText: 'maint01' })).toContainText('본사 안전관리자');
  await expect(access).toContainText('10개 — A3-01 · A3-02'); // 본사 안전관리자 화면(canAccess) 즉시 반영
  await aside.getByLabel('대전 B 물류센터').check();
  await aside.getByRole('button', { name: '현장 범위 저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '현장 범위 — 정정비' })).toBeVisible();
  await expect(rows.filter({ hasText: 'maint01' })).toContainText('SITE-002');
  await aside.getByLabel('상태').selectOption('suspended');
  await expect(page.getByRole('status').filter({ hasText: '상태 — 정정비 정지' })).toBeVisible();
  await expect(rows.filter({ hasText: 'maint01' })).toContainText('정지');
});
