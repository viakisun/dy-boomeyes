// [B4-02] 프로토콜 관리 · [B4-05] 알림 기준 — D4 장면 8 (specs/admin-protocol-rules AC-1~AC-7)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

const login = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.getByText('ops01', { exact: true }).click();
  await expect(page).toHaveURL(/\/b4\/protocols/);
};

test('[B4-02] 버전 2 · 샘플 테스트: 필드 누락 → 경로 · 정상 → 알림 0 · 이상 값 → 알림 미리보기 [FR-020] [FR-011]', async ({
  page,
}) => {
  await login(page);
  await expect(page.locator(`[data-scr="${SCR['B4-02']}"]`)).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('cpb.v0.1');
  await page.getByRole('tab', { name: '필드 누락' }).click();
  await page.getByRole('button', { name: '샘플 테스트' }).click();
  const errors = page.getByRole('list', { name: '파싱 오류' });
  await expect(errors).toContainText('gps.latitude');
  await expect(errors).toContainText('power');
  await expect(page.getByText('오류 2건 · 알림 1건')).toBeVisible(); // 장면 8: 오류 샘플에서도 알림 확인
  await expect(page.getByLabel('발생 알림 미리보기')).toContainText('하네스 단선');
  await page.getByRole('tab', { name: '타입 오류' }).click();
  await page.getByRole('button', { name: '샘플 테스트' }).click();
  await expect(errors).toContainText('power.voltage_value');
  await expect(page.getByLabel('발생 알림 미리보기')).toContainText('고장코드 E-011');
  await page.getByRole('tab', { name: '정상', exact: true }).click();
  await page.getByRole('button', { name: '샘플 테스트' }).click();
  await expect(page.getByText('정상 파싱 · 알림 0건')).toBeVisible();
  await page.getByRole('tab', { name: '이상 값' }).click();
  await page.getByRole('button', { name: '샘플 테스트' }).click();
  await expect(page.getByText('정상 파싱 · 알림 3건')).toBeVisible();
  const preview = page.getByLabel('발생 알림 미리보기');
  await expect(preview).toContainText('고장코드 E-021');
  await expect(preview).toContainText('380V 전압 이상');
  await expect(preview).toContainText('수송관 도달률 96%');
});

test('[B4-02] 업로드: 깨진 YAML → 오류 목록 · 정상 YAML → 테스트 버전 3 [FR-020]', async ({ page }) => {
  await login(page);
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({
    name: 'bad.yaml',
    mimeType: 'text/yaml',
    buffer: Buffer.from('version: v9\ngroups: []\n'),
  });
  const errors = page.getByRole('list', { name: '검증 오류' });
  await expect(errors).toContainText('version');
  await expect(errors).toContainText('groups');
  const noUnit =
    'version: cpb.v0.9\ngroups:\n  - group: g\n    key: g\n    required: true\n    fields:\n      - { name: x, type: number }\n';
  await input.setInputFiles({ name: 'nounit.yaml', mimeType: 'text/yaml', buffer: Buffer.from(noUnit) });
  await expect(errors).toContainText('숫자 필드는 단위(unit) 필요'); // AC-2 단위 검증
  await expect(page.locator('table tbody tr')).toHaveCount(2);
  const good = [
    'version: cpb.v0.3',
    'groups:',
    '  - group: 공통 헤더',
    '    key: null',
    '    required: true',
    '    fields:',
    '      - { name: protocol_version, type: string, required: true }',
    '      - { name: device_id, type: string, required: true }',
    '      - { name: sequence, type: number, unit: count }',
    '',
  ].join('\n');
  await input.setInputFiles({ name: 'cpb-v0.3.yaml', mimeType: 'text/yaml', buffer: Buffer.from(good) });
  await expect(page.getByRole('status').filter({ hasText: '테스트 버전 등록 — cpb.v0.3' })).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(3);
  await expect(page.getByRole('complementary', { name: '버전 상세' })).toContainText('cpb.v0.3');
  await expect(page.getByRole('complementary', { name: '버전 상세' })).toContainText('sequence:number (count)'); // 단위 표시
});

test('[B4-05] 알림 8종 · 임계 편집 → 저장 → 이력 · 고장코드 E-021 · 시나리오 잠금 2 [FR-011] [FR-006] [FR-036]', async ({
  page,
}) => {
  await login(page);
  await page.goto('/b4/rules');
  await expect(page.locator(`[data-scr="${SCR['B4-05']}"]`)).toBeVisible();
  await expect(page.getByRole('region', { name: '알림 기준 목록' }).locator('[data-kind]')).toHaveCount(8);
  await expect(page.getByRole('button', { name: '저장' })).toBeDisabled();
  await page.getByLabel('수송관 도달률 임계 접근').fill('0.85');
  await page.getByLabel('수송관 도달률 임계 접근').blur();
  await expect(page.getByRole('button', { name: '저장' })).toBeEnabled();
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '알림 기준 저장 완료' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: '변경 이력' })).toContainText('알림 기준 저장');
  await expect(page.getByLabel('수송관 도달률 임계 접근')).toHaveValue('0.85');
  await page.getByRole('tab', { name: '고장코드' }).click();
  await expect(page).toHaveURL(/tab=codes/);
  await expect(page.getByLabel('E-021 이름')).toHaveValue('380V 전압 이상');
  // 탭별 저장 격리: 알림 기준 탭의 미저장 편집이 고장코드 저장으로 유실되지 않는다
  await page.getByRole('tab', { name: '알림 기준' }).click();
  await page.getByLabel('필터 도달률 임계 접근').fill('0.8');
  await page.getByLabel('필터 도달률 임계 접근').blur();
  await page.getByRole('tab', { name: '고장코드' }).click();
  await page.getByLabel('E-021 가이드').fill('상 전압 확인 후 재기동');
  await page.getByLabel('E-021 가이드').blur();
  await expect(page.getByText('알림 기준 탭에 미저장 변경')).toBeVisible();
  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '고장코드 저장 완료' })).toBeVisible();
  await page.getByRole('tab', { name: '알림 기준' }).click();
  await expect(page.getByLabel('필터 도달률 임계 접근')).toHaveValue('0.8');
  await expect(page.getByRole('button', { name: '저장' })).toBeEnabled();
  await page.getByRole('tab', { name: '시나리오 등급' }).click();
  await expect(page.getByText('잠금 · 현장 검증 후')).toHaveCount(2);
});
