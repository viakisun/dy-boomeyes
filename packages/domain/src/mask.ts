// 개인정보 마스킹(FR-023 쇼케이스 · 정책은 DISC-031 미확정 — 표시 규칙만: 이름 가운데 · 전화 가운데 4자리)
/** 홍길동 → 홍*동 · 김현장 → 김*장 · 두 글자는 뒤를 · 네 글자 이상은 가운데 전부 */
export function maskName(name: string): string {
  const s = name.trim();
  if (s.length <= 1) return s;
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}${'*'.repeat(s.length - 2)}${s[s.length - 1]}`;
}
/** 010-1234-5678 → 010-****-5678 · 구분자 없으면 4~7번째 자리 */
export function maskPhone(phone: string): string {
  const parts = phone.split('-');
  if (parts.length === 3) return `${parts[0]}-${'*'.repeat(parts[1]!.length)}-${parts[2]}`;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}
