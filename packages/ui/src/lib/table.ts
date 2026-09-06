// DataTable 열 정의 (generics 스크립트에서는 interface export가 안 돼 분리) — kind가 셀 서식을 정한다(DY-design §11.2)
export type ColumnKind = 'id' | 'text' | 'num' | 'date' | 'status';
export interface Column {
  key: string;
  label: string;
  /** id → code-md · nowrap · 내용 폭 | num → 우측 · tabular · nowrap | date → tabular · nowrap | status → nowrap | text(기본) → 1줄 truncate — 잘릴 수 있는 셀은 스니펫에서 `<span title>`을 붙인다(§11.2) */
  kind?: ColumnKind;
  /** text 열을 줄바꿈·잘림 없이(짧은 이름·복합 셀) */
  nowrap?: boolean;
  /** @deprecated kind: 'num'을 쓴다 */
  align?: 'left' | 'right';
}
