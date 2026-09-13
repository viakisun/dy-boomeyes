import { test, expect, startOwner, ownerHost, openDocuments, type OwnerApp } from './owner-helpers';

interface ResourceAudit {
  instance: string;
  urls: { url: string; revoked: boolean }[];
  workers: { url: string; terminated: boolean }[];
}
declare global {
  interface Window {
    __ownerResourceAudit: ResourceAudit;
  }
}

export function ownerResourcesFlows(app: OwnerApp) {
  test.use({ serviceWorkers: 'block' });
  test('[FR-016] [AC-O11] [AC-O15] ten real PDF cancellations release URLs/workers; double confirmation stores once and logout releases attachments', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      const audit: ResourceAudit = { instance: crypto.randomUUID(), urls: [], workers: [] };
      window.__ownerResourceAudit = audit;
      const create = URL.createObjectURL.bind(URL);
      const revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (object) => {
        const url = create(object); // Actual browser resource creation, not a stub.
        audit.urls.push({ url, revoked: false });
        return url;
      };
      URL.revokeObjectURL = (url) => {
        revoke(url);
        const record = audit.urls.find((entry) => entry.url === url);
        if (record) record.revoked = true;
      };
      window.Worker = new Proxy(window.Worker, {
        construct(target, args, newTarget) {
          const worker = Reflect.construct(target, args, newTarget) as Worker;
          const url = String(args[0]);
          // MapLibre has separate lifecycle tests. Track the real PDF.js module worker only.
          if (/pdf\.worker/i.test(url)) {
            const record = { url, terminated: false };
            audit.workers.push(record);
            const terminate = worker.terminate.bind(worker);
            worker.terminate = () => {
              terminate();
              record.terminated = true;
            };
          }
          return worker;
        },
      });
    });
    await startOwner(page, app);
    await openDocuments(page);
    const host = ownerHost(page, 'documents');
    const documents = host.locator('button[data-doc]');
    // 차량 서류 종류가 늘어도 흔들리지 않게 세션 첨부 유무로 본다
    const attached = host.locator('button[data-doc*="-SESSION-"]');
    await expect(documents.first()).toBeVisible();
    await expect(attached).toHaveCount(0);
    await expect
      .poll(() =>
        host.locator('[data-document-viewer] img').evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(700);
    const baseline = await page.evaluate(() => ({
      instance: window.__ownerResourceAudit.instance,
      urls: window.__ownerResourceAudit.urls.length,
      workers: window.__ownerResourceAudit.workers.length,
    }));
    const resources = () =>
      page.evaluate(({ urls, workers }) => {
        const audit = window.__ownerResourceAudit;
        const created = audit.urls.slice(urls);
        const parsed = audit.workers.slice(workers);
        return {
          instance: audit.instance,
          createdUrls: created.length,
          activeUrls: created.filter((entry) => !entry.revoked).map((entry) => entry.url),
          createdWorkers: parsed.length,
          activeWorkers: parsed.filter((entry) => !entry.terminated).map((entry) => entry.url),
        };
      }, baseline);
    const input = page.getByLabel('시연 파일 선택', { exact: true });
    const dialog = page.getByRole('dialog', { name: '첨부 미리보기', exact: true });
    const observations = [];
    for (let visit = 1; visit <= 10; visit++) {
      const before = await resources();
      await input.setInputFiles('packages/mock/src/assets/owner/cpb-001-certificate.pdf');
      await expect(dialog).toBeVisible();
      await expect
        .poll(() =>
          dialog
            .getByRole('img')
            .evaluate(
              (image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 700,
            ),
        )
        .toBe(true);
      const open = await resources();
      expect(open.createdWorkers, 'Each preview must run a real PDF worker').toBeGreaterThan(before.createdWorkers);
      expect(
        open.createdUrls - before.createdUrls,
        'The original and rendered preview need real URLs',
      ).toBeGreaterThanOrEqual(2);
      await dialog.getByRole('button', { name: '취소', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect.poll(async () => (await resources()).activeUrls).toEqual([]);
      await expect.poll(async () => (await resources()).activeWorkers).toEqual([]);
      await expect(attached).toHaveCount(0);
      observations.push({ visit, state: await resources() });
    }
    await input.setInputFiles('packages/mock/src/assets/owner/cpb-001-certificate.pdf');
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => dialog.getByRole('img').evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(700);
    const pending = await resources();
    expect(pending.activeUrls.length).toBeGreaterThanOrEqual(2);
    await dialog.getByRole('button', { name: '첨부 확정', exact: true }).dblclick();
    await expect(dialog).toHaveCount(0);
    await expect(attached).toHaveCount(1);
    await expect(documents.filter({ hasText: 'cpb-001-certificate.pdf' })).toHaveCount(1);
    const original = host.locator('[data-document-viewer] img');
    await expect
      .poll(() => original.evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(700);
    const confirmed = await resources();
    expect(confirmed.activeUrls).toEqual(pending.activeUrls);
    expect(confirmed.activeWorkers).toEqual([]);
    // Navigate away and back so the second click cannot be hidden by a transient render.
    await page.getByRole('navigation').getByRole('link', { name: '보유 장비', exact: true }).click();
    await expect(ownerHost(page, 'fleet')).toBeVisible();
    await openDocuments(page);
    await expect(attached).toHaveCount(1);
    await expect(documents.filter({ hasText: 'cpb-001-certificate.pdf' })).toHaveCount(1);
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await expect(page.getByRole('button', { name: '데모 계정으로 로그인', exact: true })).toBeVisible();
    await expect.poll(async () => (await resources()).activeUrls).toEqual([]);
    await expect.poll(async () => (await resources()).activeWorkers).toEqual([]);
    const final = await resources();
    expect(final.instance, 'Audit must survive SPA logout; a reset must not imitate cleanup').toBe(baseline.instance);
    expect(final.createdWorkers).toBeGreaterThanOrEqual(11);
    expect(final.createdUrls).toBeGreaterThanOrEqual(22);
    expect(await page.evaluate(() => localStorage.getItem('boomeyes.session'))).toBeNull();
    await testInfo.attach('owner-document-resource-lifecycle.json', {
      body: JSON.stringify(
        {
          method:
            'Native object URL functions and native PDF Worker constructor/terminate are called by instrumentation. Ten cancellations plus one double-click confirmation; API memory scope only.',
          observations,
          confirmed,
          final,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });
  });
}
