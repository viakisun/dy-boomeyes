// [A1-11] 부품 점검 입력 · [A2-09] 교체·폐기 처리 (specs/equipment-parts AC-2 · AC-3 · W2 구조)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[A1-11] 스캔 비활성(DISC-043) · P-001 점검 합 → 점검됨 · P-003 불 → 교체 대상 · 이력에 실측·행위자 [FR-032] [FR-035]', async ({
  page,
}) => {
  await page.goto('/a1/parts/inspect?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A1-11']}"]`)).toBeVisible();
  await expect(page.getByRole('button', { name: /태그 스캔/ })).toBeDisabled();
  await expect(page.getByLabel('부품', { exact: true })).toHaveValue('P-001');
  const form = page.getByRole('form', { name: '부품 점검' });
  await form.getByLabel('실측 두께(mm)').fill('4.2');
  await form.getByRole('button', { name: '점검 제출' }).click();
  await expect(page.getByRole('status').filter({ hasText: '점검 — P-001 점검됨' })).toBeVisible();
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('점검 · 4.2mm · 합');
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('safety01');
  await page.getByLabel('부품', { exact: true }).selectOption('P-003');
  await expect(page).toHaveURL(/part=P-003/);
  await form.getByLabel('실측 두께(mm)').fill('2.9');
  await form.getByLabel('외관').selectOption('wear');
  await form.getByLabel('OEM 합불').selectOption('fail');
  await form.getByRole('button', { name: '점검 제출' }).click();
  await expect(page.getByRole('status').filter({ hasText: '점검 — P-003 교체 대상' })).toBeVisible();
  await expect(page.getByLabel('부품', { exact: true }).locator('option[value="P-003"]')).toHaveAttribute(
    'disabled',
    '',
  ); // due는 점검 대상 아님
});

test('[A2-09] P-004(교체 대상) 교체: 사유·작업자 → 확인 → 재고 10 → 9 · 이어서 폐기 → 폐기 [FR-032]', async ({
  page,
}) => {
  await page.goto('/a2/parts/replace?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['A2-09']}"]`)).toBeVisible();
  await expect(page.getByLabel('부품', { exact: true })).toHaveValue('P-004');
  await expect(page.locator('[data-stock]')).toHaveAttribute('data-stock', '10');
  const form = page.getByRole('form', { name: '교체 처리' });
  await expect(form.getByLabel('작업자')).toHaveValue('박기사');
  await form.getByLabel('사유').selectOption('마모 한계');
  await form.getByRole('button', { name: '교체 처리' }).click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toContainText('재고 10 → 9');
  await dialog.getByRole('button', { name: '교체 확정' }).click();
  await expect(page.getByRole('status').filter({ hasText: '교체 — P-004 · 재고 9' })).toBeVisible();
  await expect(page.locator('[data-stock]')).toHaveAttribute('data-stock', '9');
  await expect(page.locator('ol[aria-label="이력"] li').first()).toContainText('교체 · 마모 한계');
  const discard = page.getByRole('form', { name: '폐기 처리' });
  await discard.getByLabel('사유').selectOption('균열·손상');
  await discard.getByRole('button', { name: '폐기 처리' }).click();
  await page.locator('dialog[open]').getByRole('button', { name: '폐기 확정' }).click();
  await expect(page.getByRole('status').filter({ hasText: '폐기 — P-004' })).toBeVisible();
  await expect(page.getByText('폐기', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('form', { name: /처리$/ })).toHaveCount(0); // discarded는 더 처리할 수 없다
});
