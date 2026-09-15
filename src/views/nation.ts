// 전국 단계 좌측 카드 — 확인이 필요한 현장 목록.
import { COLOR, LABEL, WARN_ST } from '../ui';
import { db } from '../store';

export function nationCard(): string {
  const warn = db.sites.filter(s => WARN_ST.includes(s.st));
  const warnUnits = db.sites.flatMap(s => s.units).filter(u => WARN_ST.includes(u.st)).length;
  const row = (s: (typeof warn)[number]) =>
    `<div class="row" data-site="${s.id}" onclick="go('site','${s.id}')">` +
    `<div><div class="nm">${s.name}</div>` +
    `<div class="sub"><em style="color:${COLOR[s.st]}">${LABEL[s.st]}</em> · ${s.note}</div></div>` +
    `<div class="cnt">${s.n}대</div></div>`;
  return (
    `<header><h2>확인 필요<small>${warn.length}개 현장 · ${warnUnits}대</small></h2>` +
    `<a href="#" onclick="goTab('fleet');return false">전체 ${db.sites.length}개 현장</a></header>` +
    `<div class="body">${warn.map(row).join('')}</div>`
  );
}
