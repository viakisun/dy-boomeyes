// DataTable 열 정의 (generics 스크립트에서는 interface export가 안 돼 분리)
export interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
}
