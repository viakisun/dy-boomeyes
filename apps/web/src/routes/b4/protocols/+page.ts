// B4-02 프로토콜 관리 — 버전 목록 · 업로드 검증 · 샘플 테스트 (specs/admin-protocol-rules AC-1 · AC-2 · AC-3)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { api } = await parent();
  const [protocols, samples] = await Promise.all([api.protocols(), api.samples()]);
  return { protocols, samples };
};
