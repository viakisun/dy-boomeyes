// [B1-08] 이벤트 복기(W2 구조) · [B1-02] 피드 복기 링크 (specs/event-replay AC-1~4)
import { expect, test } from '@playwright/test';
import { SCR } from '../../packages/domain/src/generated/ids';

test('[B1-08] EV-001: 헤더(event_id·종류·장비·t0·AL-001·C-105) · 4레인 · 바디캠 없음 · 잠금 배지 · 삭제·편집 없음 · 영상 2(목업) [FR-033] [FR-024]', async ({
  page,
}) => {
  await page.goto('/b1/events/EV-001?state=default&capture=1');
  const root = page.locator(`[data-scr="${SCR['B1-08']}"]`);
  await expect(root).toBeVisible();
  await expect(page.getByRole('heading', { name: /이벤트 복기 — EV-001/ })).toBeVisible();
  const head = page.locator('dl[aria-label="이벤트"]');
  await expect(head).toContainText('전압 이상 · 긴급');
  await expect(head).toContainText('CPB-003 · 3호기');
  await expect(head).toContainText('±60초');
  const link = page.locator('dl[aria-label="연결"]');
  await expect(link).toContainText('AL-001');
  await expect(link).toContainText('C-105');
  await expect(link).toContainText('일부 확보 — 일반·AI 세그먼트 있음 · 바디캠 없음'); // 영상 확보 상태(ENT-19) — 사건 상태와 별개
  await expect(page.locator('[data-evidence="partial"]')).toContainText('영상 일부 확보');
  await expect(page.getByText('원본 보존', { exact: true })).toBeVisible();
  await expect(page.getByText('원본 보존', { exact: true })).toHaveAttribute('data-ref', 'NFR-015');
  const lanes = page.locator('section[aria-label="복기 타임라인"] ol');
  await expect(lanes).toHaveCount(4);
  await expect(page.locator('[data-lane="bodycam"]')).toContainText('없음');
  await expect(page.locator('[data-lane="cpb"]')).toContainText('전압 342V · E-021 발생');
  await expect(page.locator('[data-video-lane] [data-camera]')).toHaveCount(2); // 일반 = 라이브(video) · AI = 스냅샷(img)
  await expect(page.locator('video')).toHaveCount(1);
  await expect(page.getByText('목업')).toHaveCount(0); // 구현 상태는 화면에 내지 않는다(§12.2)
  await expect(page.getByRole('button', { name: /삭제|편집|수정/ })).toHaveCount(0);
});

test('[B1-08] 커서: →×3 → t0+3s · 4레인 표시 시각 동일 · 레인 클릭 → 이동 · 없는 event_id는 404 EmptyState [FR-033]', async ({
  page,
}) => {
  await page.goto('/b1/events/EV-001?state=default&capture=1');
  const root = page.locator(`[data-scr="${SCR['B1-08']}"]`);
  await expect(root).toHaveAttribute('data-cursor', '0');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(root).toHaveAttribute('data-cursor', '3');
  await expect(page.locator('[data-cursor-label]')).toContainText('t0+3s');
  const times = await page.locator('[data-lane]:not([data-lane="bodycam"]) [data-lane-time]').allTextContents();
  expect(new Set(times).size).toBe(1); // 3레인 표시 시각 동일(바디캠은 없음)
  await page.keyboard.press('ArrowLeft');
  await expect(root).toHaveAttribute('data-cursor', '2');
  await page.locator('[data-lane="general"] [role="presentation"]').click({ position: { x: 5, y: 10 } });
  const c = Number(await root.getAttribute('data-cursor'));
  expect(c).toBeLessThan(-50); // 레인 왼쪽 끝 ≈ −60s
  await page.goto('/b1/events/EV-999?state=default&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-08']}"]`)).toContainText('이벤트 EV-999 없음');
  await expect(page.locator('section[aria-label="복기 타임라인"]')).toHaveCount(0);
});

test('[B1-02] 알림 피드 E-021 행의 "복기" 링크 → /b1/events/EV-001 [FR-024] [FR-033]', async ({ page }) => {
  await page.goto('/b1/dash?state=dash&capture=1');
  const rows = page.locator('ul[aria-label="알림"] li');
  const row = rows.filter({ hasText: 'E-021' }).first();
  const replay = row.getByRole('link', { name: '복기 EV-001' });
  await expect(replay).toHaveAttribute('href', /\/b1\/events\/EV-001$/);
  await expect(rows.filter({ hasText: '통신 두절' }).first().getByRole('link', { name: /복기/ })).toHaveCount(0); // 이벤트 없는 알림
  await replay.click();
  await expect(page.locator(`[data-scr="${SCR['B1-08']}"]`)).toBeVisible();
  await expect(page.getByRole('heading', { name: /이벤트 복기 — EV-001/ })).toBeVisible();
});

test('[B1-08] pending 픽스처: 영상 업로드 대기 — 업무(C-105)·잠금 표시는 그대로 [FR-033]', async ({ page }) => {
  await page.goto('/b1/events/EV-001?state=pending&capture=1');
  await expect(page.locator(`[data-scr="${SCR['B1-08']}"]`)).toBeVisible();
  await expect(page.locator('[data-evidence="pending"]')).toContainText('영상 업로드 대기');
  await expect(page.locator('dl[aria-label="연결"]')).toContainText('현장 업로드 뒤 갱신');
  await expect(page.locator('dl[aria-label="연결"]')).toContainText('C-105');
  await expect(page.getByText('원본 보존', { exact: true })).toBeVisible();
});
