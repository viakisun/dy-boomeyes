// 인라인 on*= 가 부르는 이름이 window에 실제로 얹혀 있는지 검사한다.
// 이 어긋남은 런타임에 ReferenceError로만 드러나서 클릭이 조용히 죽는다 — 이번 작업에서 세 번 겪었다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|html)$/.test(path)) files.push(path);
  }
})('src');
files.push('index.html');

// 마크업과 생성 HTML의 on*= 에서 부르는 최상위 이름을 모은다
const called = new Map();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  // 앞이 공백이 아닐 수 있다 — 템플릿 리터럴 안에서는 백틱 바로 뒤에 온다
  for (const [, handler] of text.matchAll(/\bon[a-z]+="([^"]*)"/g)) {
    // ${...} 안은 TS 지역 변수다. 전역 이름이 아니므로 지운다
    const globals = handler.replace(/\$\{[^}]*\}/g, '');
    for (const [, name] of globals.matchAll(/([A-Za-z_$][\w$]*)\s*[(.]/g))
      if (!called.has(name)) called.set(name, file);
  }
}

// window에 얹은 이름
const mainFile = files.find(f => f.endsWith('main.ts'));
const block = readFileSync(mainFile, 'utf8').match(/Object\.assign\(window as any, \{([\s\S]*?)\n\}\)/);
if (!block) {
  console.error('window에 얹는 자리를 찾지 못했다');
  process.exit(2);
}
const exposed = new Set(
  block[1]
    .split(',')
    .map(s => s.trim().split(':')[0].trim())
    .filter(Boolean),
);

// 브라우저가 늘 주는 것은 뺀다
const BUILTIN = new Set(['location', 'navigator', 'document', 'window', 'this', 'Math', 'String', 'Number']);

const missing = [...called].filter(([name]) => !exposed.has(name) && !BUILTIN.has(name));
const unused = [...exposed].filter(name => !called.has(name));

for (const [name, file] of missing) console.error(`  없음     : ${name}()  ← ${file} 가 부른다`);
for (const name of unused) console.error(`  안 쓰임  : ${name}  ← window에 얹었지만 아무도 부르지 않는다`);
if (missing.length || unused.length) {
  console.error(`\n없는 핸들러 ${missing.length}개, 남는 핸들러 ${unused.length}개.`);
  process.exit(1);
}
console.log(`인라인 핸들러 ${called.size}개 전부 window에 있습니다.`);
