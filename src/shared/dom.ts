// DOM 잔심부름.

export const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

/** 속성값에 그대로 넣기 전에 따옴표를 막는다 */
export const attr = (v: string) => v.replace(/"/g, '&quot;');
