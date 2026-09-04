// css.mjs — CSS 변수명 · 값 직렬화 · Tailwind theme 이름 (build/doc 공용)
export const cssVar = (p) => '--' + p.replace(/\./g, '-');
const q = (s) => (/[^a-zA-Z0-9-]/.test(s) ? `'${s}'` : s);
export function cssValue(type, v) {
  switch (type) {
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v]).map(q).join(', ');
    case 'cubicBezier':
      return `cubic-bezier(${v.join(', ')})`;
    case 'shadow':
      return (Array.isArray(v) ? v : [v])
        .map((s) => `${s.inset ? 'inset ' : ''}${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread ?? '0'} ${s.color}`)
        .join(', ');
    default:
      return String(v);
  }
}

export function themeName(p) {
  const s = p.split('.');
  if (s[0] === 'sys' && s[1] === 'color') {
    const r = s.slice(2);
    if (r[0] === 'bg') return `--color-${r.slice(1).join('-')}`;
    if (r[0] === 'fg') return r[1] === 'default' ? '--color-fg' : `--color-fg-${r.slice(1).join('-')}`;
    if (r[0] === 'border') return r[1] === 'default' ? '--color-border' : `--color-border-${r.slice(1).join('-')}`;
    if (r[0] === 'accent')
      return r[1] === 'solid' && r.length === 2 ? '--color-accent' : `--color-accent-${r.slice(1).join('-')}`;
    if (r[0] === 'status')
      return r[2] === 'solid' && r.length === 3 ? `--color-${r[1]}` : `--color-${[r[1], ...r.slice(2)].join('-')}`;
    if (r[0] === 'domain')
      return r[3] === 'solid' && r.length === 4 ? `--color-${r[1]}-${r[2]}` : `--color-${r.slice(1).join('-')}`;
    return `--color-${r.join('-')}`;
  }
  if (s[0] === 'ref' && s[1] === 'color' && s[2] !== 'on') return `--color-${s.slice(2).join('-')}`;
  if (s[0] === 'ref' && s[1] === 'space') return `--spacing-${s[2]}`;
  if (s[0] === 'sys' && s[1] === 'space') return `--spacing-${s.slice(2).join('-')}`;
  if (s[0] === 'sys' && s[1] === 'size') return `--spacing-size-${s.slice(2).join('-')}`;
  if (s[0] === 'sys' && s[1] === 'layout' && s[2] !== 'breakpoint') return `--spacing-layout-${s.slice(2).join('-')}`;
  if (s[0] === 'ref' && s[1] === 'radius') return `--radius-${s[2]}`;
  if (s[0] === 'sys' && s[1] === 'radius') return `--radius-${s.slice(2).join('-')}`;
  if (s[0] === 'sys' && s[1] === 'shadow') return `--shadow-${s.slice(2).join('-')}`;
  if (s[0] === 'ref' && s[1] === 'font' && s[2] === 'family') return `--font-${s[3]}`;
  if (s[0] === 'ref' && s[1] === 'font' && s[2] === 'weight') return `--font-weight-${s[3]}`;
  if (s[0] === 'sys' && s[1] === 'type') return `--text-${s.slice(2).join('-')}`;
  if (s[0] === 'ref' && s[1] === 'motion' && s[2] === 'easing') return `--ease-${s[3]}`;
  return null;
}
