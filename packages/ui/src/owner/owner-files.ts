// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Vite URL ambient declaration must also be visible to source consumers in video/apps.
/// <reference path="./assets.d.ts" />
import { OWNER_UPLOAD_LIMIT, type OwnerAttachment } from '@boomeyes/domain';

/** Parse the actual file before offering confirmation; MIME alone is not validation. */
export async function prepareOwnerAttachment(file: File, signal?: AbortSignal): Promise<OwnerAttachment> {
  if (file.size === 0) throw new Error('빈 파일입니다. 원문 파일을 다시 선택해 주세요.');
  if (file.size > OWNER_UPLOAD_LIMIT) throw new Error('10 MB 이하 파일을 선택해 주세요.');
  if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
    throw new Error('PDF, PNG, JPEG 파일을 선택해 주세요.');
  }
  const url = URL.createObjectURL(file);
  let previewUrl: string | undefined;
  try {
    if (file.type === 'application/pdf') {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        stopAtErrors: true,
        useSystemFonts: true,
      });
      const abort = () => {
        void task.destroy();
      };
      signal?.addEventListener('abort', abort, { once: true });
      try {
        if (signal?.aborted) throw new Error('cancelled');
        const pdf = await task.promise;
        if (!pdf.numPages) throw new Error('empty PDF');
        const page = await pdf.getPage(1);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 1200 / natural.width, 1800 / natural.height) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('preview failed'))), 'image/png'),
        );
        previewUrl = URL.createObjectURL(blob);
        // Validate remaining page content too; no success on a broken later page.
        for (let number = 2; number <= pdf.numPages; number++) {
          const next = await pdf.getPage(number);
          await next.getOperatorList();
          next.cleanup();
        }
      } finally {
        signal?.removeEventListener('abort', abort);
        await task.destroy();
      }
    } else {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('empty image');
    }
    if (signal?.aborted) throw new Error('cancelled');
    return { name: file.name, size: file.size, type: file.type as OwnerAttachment['type'], url, previewUrl };
  } catch {
    URL.revokeObjectURL(url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    throw new Error('원문을 읽을 수 없습니다. 손상되지 않은 파일을 다시 선택해 주세요.');
  }
}

/** Only unconfirmed files are released here. Confirmed files belong to the session API. */
export function releaseOwnerAttachment(file: OwnerAttachment | null) {
  if (!file) return;
  URL.revokeObjectURL(file.url);
  if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
}
