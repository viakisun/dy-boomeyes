import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { ElementHandle, Locator, Page, Route } from '@playwright/test';
import {
  test,
  expect,
  startOwner,
  ownerHost,
  noOverflow,
  OWNER_PATHS,
  unitPath,
  UNIT,
  type OwnerApp,
} from './owner-helpers';

const CERTIFICATE = 'packages/mock/src/assets/owner/cpb-001-certificate.pdf';
const PDF_NAME = 'cpb-001-certificate.pdf';
const PREVIEW_REQUEST = /\/cpb-001-certificate[^/]*\.png(?:\?|$)/;
const VIDEO_REQUEST = /\.mp4(?:\?|$)/;

async function loadedOriginal(image: Locator) {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(700);
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalHeight))
    .toBeGreaterThan(1000);
  const ink = await image.evaluate((element) => {
    const original = element as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = original.naturalWidth;
    canvas.height = original.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(original, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let marked = 0;
    for (let index = 0; index < pixels.length; index += 64) {
      if (pixels[index]! < 170 && pixels[index + 1]! < 170 && pixels[index + 2]! < 170) marked++;
    }
    return marked;
  });
  expect(ink, 'Original preview must render document content, not an empty canvas').toBeGreaterThan(100);
}

/** Check the actual hit area after scrolling, including clipping and sticky overlays. */
async function actionable(page: Page, control: Locator) {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.height).toBeLessThanOrEqual(viewport.height);
  expect(
    await control.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      return hit === element || (!!hit && element.contains(hit));
    }),
    'The visible action must also receive pointer/touch input',
  ).toBe(true);
}

export function ownerContentFlows(app: OwnerApp) {
  const paths = OWNER_PATHS[app];
  // Route fault injection must reach the network; SW installation/offline-shell behavior has its own regression suite.
  test.use({ serviceWorkers: 'block' });

  test('[FR-016] [AC-O10] [AC-O11] actual certificate PDF parses, previews and attaches unchanged to the selected equipment', async ({
    page,
  }, testInfo) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    const host = ownerHost(page, 'documents');
    const documents = host.locator('button[data-doc]');
    // 차량 서류 종류가 늘어도 흔들리지 않게, 총수가 아니라 「세션 첨부」 유무로 본다
    const attached = host.locator('button[data-doc^="CPB-001-SESSION-"]');
    await expect(documents.first()).toBeVisible();
    await expect(attached).toHaveCount(0);
    await page.getByLabel('시연 파일 선택', { exact: true }).setInputFiles(CERTIFICATE);
    const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('1호기에 첨부할 파일을 확인해 주세요.');
    const preview = dialog.getByRole('img', { name: `CPB-001 ${PDF_NAME} 원문`, exact: true });
    await loadedOriginal(preview);
    expect(await preview.getAttribute('src')).toMatch(/^blob:/);
    await dialog.getByRole('button', { name: '첨부 확정', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(attached).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: '시연 파일을 첨부했습니다' })).toBeVisible();
    const viewer = host.locator('[data-document-viewer]');
    await expect(viewer).toHaveAttribute('data-doc', /^CPB-001-SESSION-/);
    await loadedOriginal(viewer.getByRole('img', { name: `CPB-001 ${PDF_NAME} 원문`, exact: true }));
    const originalLink = viewer.getByRole('link', { name: '원문 새 창 열기', exact: true });
    const originalHash = await originalLink.evaluate(async (element) => {
      const bytes = await (await fetch((element as HTMLAnchorElement).href)).arrayBuffer();
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
      return [...digest].map((value) => value.toString(16).padStart(2, '0')).join('');
    });
    expect(originalHash).toBe(createHash('sha256').update(readFileSync(CERTIFICATE)).digest('hex'));
    await testInfo.attach('owner-pdf-original-preview.png', {
      body: await viewer.screenshot(),
      contentType: 'image/png',
    });
  });

  test('[FR-016] [AC-O11] [AC-O14] a PDF filename and signature do not make corrupt content attachable', async ({
    page,
  }) => {
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    const host = ownerHost(page, 'documents');
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    await input.setInputFiles({
      name: 'broken-certificate.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\nThis is not a PDF object tree.\nstartxref\n999999\n%%EOF\n'),
    });
    await expect(page.getByRole('alert').filter({ hasText: '원문을 읽을 수 없습니다' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: '첨부 미리보기', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '첨부 확정', exact: true })).toHaveCount(0);
    await expect(host.locator('button[data-doc*="-SESSION-"]')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '시연 파일을 첨부했습니다' })).toHaveCount(0);
    // A usable file can be selected after the rejection; the error does not strand the form.
    await input.setInputFiles(CERTIFICATE);
    const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
    await expect(dialog).toBeVisible();
    await loadedOriginal(dialog.getByRole('img'));
    await dialog.getByRole('button', { name: '취소', exact: true }).click();
    await expect(host.locator('button[data-doc*="-SESSION-"]')).toHaveCount(0);
  });

  test('[FR-016] [AC-O10] [AC-O14] failed original image request has an honest error and retries the same document', async ({
    page,
  }) => {
    await startOwner(page, app);
    let rejected = 0;
    const outage = async (route: Route) => {
      rejected++;
      await route.fulfill({
        status: 503,
        contentType: 'image/png',
        body: 'Simulated original preview outage',
        headers: { 'cache-control': 'no-store' },
      });
    };
    await page.route(PREVIEW_REQUEST, outage);
    await page.goto(`${paths.documents}?device=CPB-001&doc=CPB-001-CERT`);
    const viewer = page.locator('[data-document-viewer]');
    await expect(viewer).toHaveAttribute('data-doc', 'CPB-001-CERT');
    await expect(viewer.getByRole('alert')).toContainText('원문을 불러오지 못했습니다.');
    expect(rejected).toBeGreaterThan(0);
    await expect(viewer.getByRole('img')).toHaveCount(0);
    await page.unroute(PREVIEW_REQUEST, outage);
    await viewer.getByRole('button', { name: '다시 불러오기', exact: true }).click();
    await loadedOriginal(viewer.getByRole('img', { name: /CPB-001.*제작증.*원문/ }));
    await expect(viewer).toHaveAttribute('data-doc', 'CPB-001-CERT');
    await expect(viewer.getByRole('alert')).toHaveCount(0);
  });

  test('[FR-004] [AC-O09] [AC-O14] failed MP4 request recovers to actual advancing playback', async ({
    page,
  }, testInfo) => {
    await startOwner(page, app);
    let rejected = 0;
    const outage = async (route: Route) => {
      rejected++;
      await route.fulfill({
        status: 503,
        contentType: 'video/mp4',
        body: 'Simulated clip outage',
        headers: { 'cache-control': 'no-store' },
      });
    };
    await page.route(VIDEO_REQUEST, outage);
    await page.goto(paths.video);
    const host = ownerHost(page, 'video');
    await expect(host.getByRole('alert')).toContainText('영상을 불러오지 못했습니다');
    expect(rejected).toBeGreaterThan(0);
    await expect(host.locator('video')).toHaveCount(0);
    await page.unroute(VIDEO_REQUEST, outage);
    await host.getByRole('button', { name: '영상 다시 불러오기', exact: true }).click();
    const video = host.locator('video');
    await expect(video).toBeVisible();
    await expect
      .poll(() => video.evaluate((element) => (element as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(2);
    if (await video.evaluate((element) => (element as HTMLVideoElement).paused)) {
      await host.getByRole('button', { name: '재생', exact: true }).click();
    }
    await expect
      .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
      .toBeGreaterThan(0.2);
    expect(await video.evaluate((element) => (element as HTMLVideoElement).duration)).toBeCloseTo(6, 0);
    await expect(host.getByRole('alert')).toHaveCount(0);
    await testInfo.attach('owner-video-recovered.png', { body: await video.screenshot(), contentType: 'image/png' });
  });

  test('[FR-016] [AC-O13] [AC-O16] explicit 200 percent CSS zoom and landscape retain document actions and keyboard close', async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    await startOwner(page, app);
    await page.goto(`${paths.documents}?device=CPB-001`);
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    await loadedOriginal(page.locator('[data-document-viewer] img'));
    const measurements = [];
    for (const variant of [
      { name: 'css-zoom-200', width: app === 'web' ? 1280 : 390, height: app === 'web' ? 842 : 800, zoom: 2 },
      { name: 'landscape', width: 800, height: 390, zoom: 1 },
    ]) {
      await page.setViewportSize({ width: variant.width, height: variant.height });
      await page.evaluate((zoom) => {
        document.documentElement.style.zoom = String(zoom);
      }, variant.zoom);
      expect(await page.evaluate(() => Number(getComputedStyle(document.documentElement).zoom))).toBe(variant.zoom);
      await noOverflow(page);
      await actionable(page, input);
      await input.focus();
      await input.setInputFiles(CERTIFICATE);
      const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
      await expect(dialog).toBeVisible();
      await loadedOriginal(dialog.getByRole('img'));
      const confirm = dialog.getByRole('button', { name: '첨부 확정', exact: true });
      const cancel = dialog.getByRole('button', { name: '취소', exact: true });
      await actionable(page, confirm);
      await actionable(page, cancel);
      await noOverflow(page);
      measurements.push({ ...variant, dialog: await dialog.boundingBox(), cancel: await cancel.boundingBox() });
      await testInfo.attach(`owner-document-${variant.name}.png`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(input).toBeFocused();
      await actionable(page, page.getByRole('button', { name: '서류 목록으로', exact: true }));
      await page.getByRole('button', { name: '서류 목록으로', exact: true }).click();
      await expect(page.locator('[data-document-viewer]')).toHaveCount(0);
      await page.getByRole('button', { name: '1호기 제작증 열기', exact: true }).click();
      await loadedOriginal(page.locator('[data-document-viewer] img'));
    }
    await testInfo.attach('owner-zoom-method.json', {
      body: JSON.stringify(
        {
          method:
            'documentElement CSS zoom=2; separate 800×390 landscape reflow. This is not a browser chrome zoom test.',
          measurements,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
  });

  test('[FR-004] [AC-O09] [AC-O13] ten actual video visits release each previous player and source', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await startOwner(page, app);
    await page.goto(unitPath(app, UNIT['CPB-001'], 'CPB-001'));
    const retired: ElementHandle[] = [];
    try {
      for (let visit = 0; visit < 10; visit++) {
        await ownerHost(page, 'overview').getByRole('link', { name: '현장 영상', exact: true }).click();
        const video = ownerHost(page, 'video').locator('video');
        await expect(video).toBeVisible();
        await expect
          .poll(() => video.evaluate((element) => (element as HTMLVideoElement).readyState))
          .toBeGreaterThanOrEqual(2);
        if (await video.evaluate((element) => (element as HTMLVideoElement).paused)) {
          await page.getByRole('button', { name: '재생', exact: true }).click();
        }
        await expect
          .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
          .toBeGreaterThan(0.1);
        const handle = await video.elementHandle();
        expect(handle).not.toBeNull();
        retired.push(handle!);
        await page.getByRole('button', { name: '호기 화면으로', exact: true }).click();
        await expect(ownerHost(page, 'overview')).toContainText('CPB-001');
        // 호기 화면에는 카메라 벽이 있다 — 「영상 화면의 플레이어가 사라졌는가」를 본다
        await expect(ownerHost(page, 'video')).toHaveCount(0);
        await expect
          .poll(() =>
            handle!.evaluate((element) => {
              const player = element as HTMLVideoElement;
              return {
                connected: player.isConnected,
                paused: player.paused,
                src: player.getAttribute('src'),
                readyState: player.readyState,
                networkState: player.networkState,
                buffered: player.buffered.length,
                seekable: player.seekable.length,
                currentTime: player.currentTime,
                durationUnknown: Number.isNaN(player.duration),
                videoWidth: player.videoWidth,
              };
            }),
          )
          .toEqual({
            connected: false,
            paused: true,
            src: null,
            readyState: 0,
            networkState: 0,
            buffered: 0,
            seekable: 0,
            currentTime: 0,
            durationUnknown: true,
            videoWidth: 0,
          });
      }
      for (const handle of retired) {
        expect(
          await handle.evaluate((element) => {
            const player = element as HTMLVideoElement;
            return {
              paused: player.paused,
              currentTime: player.currentTime,
              buffered: player.buffered.length,
              readyState: player.readyState,
            };
          }),
        ).toEqual({ paused: true, currentTime: 0, buffered: 0, readyState: 0 });
      }
      expect(retired).toHaveLength(10);
    } finally {
      await Promise.all(retired.map((handle) => handle.dispose()));
    }
  });

  test('[FR-024] [AC-O05] [AC-O14] offline viewing preserves the last received value and its stale timestamp', async ({
    page,
    context,
  }) => {
    await startOwner(page, app);
    await page.goto(unitPath(app, UNIT['CPB-004'], 'CPB-004'));
    const host = ownerHost(page, 'overview');
    const status = host.getByRole('region', { name: '장비 상태', exact: true });
    await expect(status).toContainText('수신 지연');
    await expect(status).toContainText('공급 전압 · 마지막 수신값');
    await expect(status).toContainText('380');
    await expect(status).toContainText(/마지막 수신.*08:22|마지막 수신.*8:22/);
    // 오프라인 전후가 같은지는 같은 방식으로 읽어 견준다 — innerText를 떠 놓고 toHaveText(정규화된
    // textContent)로 견주면 KeyValueList의 <dt>/<dd> 사이 줄바꿈 때문에 내용이 같아도 어긋난다
    const read = () => status.innerText();
    const before = await read();
    await context.setOffline(true);
    await expect(
      page.getByRole('status').filter({ hasText: '오프라인 · 마지막으로 불러온 화면입니다.' }),
    ).toBeVisible();
    await expect.poll(read).toBe(before);
    await expect(status).toContainText('현재 상태를 확인할 수 없습니다.');
    // 「0 V」는 값이 없을 때 0으로 보이는 것을 막는 단언이다 — 「380 V」의 끝자리에 걸리지 않게 경계를 준다
    await expect(status).not.toContainText(/\b0 V/);
    await expect(host).toContainText('최현장');
    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: '오프라인 · 마지막으로 불러온 화면입니다.' })).toHaveCount(
      0,
    );
    await expect.poll(read).toBe(before);
  });
}
