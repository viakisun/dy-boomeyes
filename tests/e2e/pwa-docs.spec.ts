// [A2-05] 내 서류 · [A1-03] 서류 업무 승인/반려 — 제출 → 검토 업무 → 승인/반려 → 재제출 (specs/documents AC-1 · AC-2 · AC-3)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const PNG = {
  name: 'cert.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000101d0d8f7d90000000049454e44ae426082',
    'hex',
  ),
};

test('[A2-05] driver03 서류 4 · 상태 pill · expiring/rejected에만 제출 액션 · DOC-001 D-27 · DOC-005 반려 사유·재제출 [FR-015] [FR-016]', async ({
  page,
}) => {
  await page.goto('/a2/docs?state=docs&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-05']}"]`)).toBeVisible();
  const cards = page.locator('ul[aria-label="서류"] li');
  await expect(cards).toHaveCount(4); // DOC-001 · DOC-002 · DOC-003(CPB-003) · DOC-005
  await expect(page.locator('[data-doc="DOC-001"]')).toContainText('만료 임박');
  await expect(page.locator('[data-doc="DOC-001"]')).toContainText('D-27');
  await expect(page.locator('[data-doc="DOC-001"]').getByRole('button', { name: '촬영·제출' })).toBeVisible();
  await expect(page.locator('[data-doc="DOC-002"]').getByRole('button')).toHaveCount(0); // valid는 액션 없음
  await expect(page.locator('[data-doc="DOC-005"]')).toContainText('반려 사유: 서명 누락');
  await expect(page.locator('[data-doc="DOC-005"]').getByRole('button', { name: '재제출' })).toBeVisible();
});

test('[A2-05] 촬영 제출 → submitted → review(자동) · 이력 · 토스트 [FR-015]', async ({ page }) => {
  await page.goto('/a2/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a2/docs');
  await page.locator('[data-doc="DOC-001"]').getByRole('button', { name: '촬영·제출' }).click();
  await page.locator('[data-doc="DOC-001"]').locator('input[type="file"]').setInputFiles(PNG);
  await page.locator('[data-doc="DOC-001"]').getByRole('button', { name: '제출', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('제출 — 박기사 교육 이수증');
  await expect(page.locator('[data-doc="DOC-001"]')).toContainText('검토 중');
  await expect(page.locator('[data-doc="DOC-001"]').getByRole('button')).toHaveCount(0); // 검토 중엔 액션 없음
});

test('[A1-03] 서류 검토 업무(C-106 · DOC-004) → 승인 → approved · 업무 done [FR-015] [FR-008]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/inbox');
  const item = page.locator('ul[aria-label="업무"] li').filter({ hasText: '비파괴 검사 성적서 검토' });
  await expect(item).toHaveCount(1);
  await item.locator('a').click();
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible();
  await expect(page.locator('[data-doc="DOC-004"]')).toContainText('검토 중');
  await page.getByRole('button', { name: '승인', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('승인');
  await expect(page.locator('[data-doc="DOC-004"]')).toContainText('승인');
  await expect(page.getByText('완료 상태 — 할 일이 없습니다')).toBeVisible();
});

test('[A1-03] 서류 업무 반려(사유 필수) → rejected · 이력 note · 완료 [FR-015]', async ({ page }) => {
  await page.goto('/a1/login');
  await page.getByRole('button', { name: '입장' }).click();
  await page.goto('/a1/inbox/C-106');
  await page.getByRole('button', { name: '반려', exact: true }).click();
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await expect(sheet).toContainText('반려 사유');
  await expect(sheet.getByRole('button', { name: '반려' })).toBeDisabled();
  await sheet.getByLabel('반려 사유(필수)').fill('사본 흐림 — 원본 재촬영');
  await sheet.getByRole('button', { name: '반려' }).click();
  await expect(page.locator('[data-doc="DOC-004"]')).toContainText('반려 사유: 사본 흐림');
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('반려');
  await expect(page.getByText('완료 상태 — 할 일이 없습니다')).toBeVisible();
});

test('[A1-03] 접수 전(new) 서류 업무(docnew): 승인/반려 대신 접수 → 접수 후 승인/반려 → 반려(사유) → 완료 [FR-015] [FR-008]', async ({
  page,
}) => {
  await page.goto('/a1/inbox/C-106?state=docnew&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible();
  await expect(page.getByRole('button', { name: '접수' })).toBeVisible();
  await expect(page.getByRole('button', { name: '승인', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '접수' }).click();
  await expect(page.getByRole('button', { name: '승인', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '반려', exact: true }).click();
  await expect(page).toHaveURL(/sheet=review/);
  await expect(page.locator(`[data-scr="${SCR['A1-03']}"]`)).toBeVisible(); // 반려 시트는 A1-08이 아니다
  const sheet = page.locator('dialog[open][data-bottom-sheet]');
  await sheet.getByLabel('반려 사유(필수)').fill('원본 대조 필요');
  await sheet.getByRole('button', { name: '반려' }).click();
  await expect(page.locator('[data-doc="DOC-004"]')).toContainText('반려 사유: 원본 대조 필요');
  await expect(page.getByText('완료 상태 — 할 일이 없습니다')).toBeVisible();
});
