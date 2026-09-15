// 배선 검사 — 마크업과 코드가 서로 있다고 믿는 것이 실제로 있는지 본다.
//   1. 인라인 on*= 가 부르는 이름이 그 앱의 window에 얹혀 있나 (없으면 클릭이 조용히 죽는다)
//   2. 코드가 $('#id') 로 찾는 요소가 그 앱 껍데기(또는 생성 HTML)에 있나
//   3. 아무도 쓰지 않는 CSS 클래스가 남아 있나
// 셋 다 런타임에만, 또는 영영 드러나지 않는다. 손으로 세다가 세 번 놓쳤다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function filesUnder(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesUnder(path, out);
    else if (/\.(ts|html)$/.test(path)) out.push(path);
  }
  return out;
}

/** 마크업과 생성 HTML의 on*= 에서 부르는 최상위 이름을 모은다 */
function handlersIn(files) {
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
  return called;
}

/** 핸들러 이름을 문자열로 넘기는 곳(크럼의 onClick, 알림의 jump 등).
 *  문자열 안이라 확신할 수 없으므로 「없음」 판정에는 쓰지 않고, 「안 쓰임」만 지운다. */
function referencedAsData(files, known) {
  const found = new Set();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [, name] of text.matchAll(/[`'"]([A-Za-z_$][\w$]*)\(/g)) if (known.has(name)) found.add(name);
  }
  return found;
}

/** bindShell이 돌려주는 이름들 — main이 `...shell` 로 펼쳐 얹는다 */
function shellHandlers() {
  const text = readFileSync('src/shared/app-shell.ts', 'utf8');
  const ret = text.match(/\n  return \{([^}]*)\}/);
  return ret
    ? ret[1]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

/** main.ts 끝에서 window에 얹은 이름 */
function exposedIn(mainFile) {
  const block = readFileSync(mainFile, 'utf8').match(/Object\.assign\(window as any, \{([\s\S]*?)\}\);/);
  if (!block) throw new Error(`${mainFile} 에서 window에 얹는 자리를 찾지 못했다`);
  const names = [];
  for (const part of block[1].split(',')) {
    const name = part.trim().split(':')[0].trim();
    if (!name) continue;
    // `...shell` 은 공용 배선이 돌려주는 이름 전부다
    if (name.startsWith('...')) names.push(...shellHandlers());
    else names.push(name);
  }
  return new Set(names);
}

// 브라우저가 늘 주는 것은 뺀다
const BUILTIN = new Set(['location', 'navigator', 'document', 'window', 'this', 'Math', 'String', 'Number']);

const sharedFiles = filesUnder('src/shared');
const htmlFiles = readdirSync('.').filter(f => f.endsWith('.html'));
const apps = readdirSync('src/apps');

let failed = false;
for (const app of apps) {
  const appDir = join('src/apps', app);
  const mainFile = join(appDir, 'main.ts');
  // 이 앱을 띄우는 껍데기를 찾는다
  const shell = htmlFiles.find(f => readFileSync(f, 'utf8').includes(`/${mainFile}`));
  if (!shell) {
    console.error(`  ${app}: ${mainFile} 를 부르는 .html 이 없다`);
    failed = true;
    continue;
  }

  const called = handlersIn([...filesUnder(appDir), ...sharedFiles, shell]);
  const exposed = exposedIn(mainFile);

  // 공용 조각은 두 앱이 함께 쓴다 — 이 앱이 실제로 그 화면을 안 쓰면 안 부를 수도 있다.
  // 그래서 「없음」만 막고 「안 쓰임」은 알리기만 한다.
  // 코드가 $('#id') 로 찾는 요소가 그 앱 껍데기에 실제로 있는지.
  // 건설사에 없는 #rbadge 를 코드가 찾아 터진 적이 있다.
  const appFiles = [...filesUnder(appDir), ...sharedFiles];
  const wantedIds = new Set();
  const providedIds = new Set();
  // 껍데기에 박힌 것과, 화면이 그려 넣는 것(생성 HTML의 id=) 둘 다 있는 것으로 친다
  for (const file of [shell, ...appFiles]) {
    const text = readFileSync(file, 'utf8');
    for (const [, id] of text.matchAll(/\$\('#([\w-]+)'\)/g)) wantedIds.add(id);
    for (const [, id] of text.matchAll(/id="([\w-]+)"/g)) providedIds.add(id);
  }
  const missingIds = [...wantedIds].filter(id => !providedIds.has(id));

  const asData = referencedAsData(appFiles, exposed);
  const missing = [...called].filter(([name]) => !exposed.has(name) && !BUILTIN.has(name));
  const unused = [...exposed].filter(name => !called.has(name) && !asData.has(name));

  for (const [name, file] of missing) console.error(`  ${app}: 없음 — ${name}()  ← ${file} 가 부른다`);
  for (const id of missingIds) console.error(`  ${app}: 없음 — #${id}  ← 코드가 찾는데 ${shell} 에 없다`);
  for (const name of unused) console.warn(`  ${app}: 안 쓰임 — ${name}`);
  if (missing.length || missingIds.length) failed = true;
  else console.log(`  ${app}: 인라인 핸들러 ${called.size}개 · 요소 ${wantedIds.size}개 전부 있습니다 (${shell})`);
}

/* ---------- 3. 죽은 CSS ---------- */

const css = readFileSync('src/style.css', 'utf8');
// 선택자(여는 중괄호 앞)에서만 클래스를 뽑는다 — 값 안의 1.5em·a.png을 잡지 않으려고.
// .mk.shifted 처럼 붙어 있는 뒤쪽 클래스도 세야 한다.
const declared = new Set();
for (const [, , selector] of css.matchAll(/(^|[};])\s*([^{};@]+?)\s*\{/g))
  for (const [, name] of selector.matchAll(/\.([A-Za-z][\w-]*)/g)) declared.add(name);
const codeText = [...filesUnder('src'), ...htmlFiles]
  .filter(f => !f.endsWith('.css'))
  .map(f => readFileSync(f, 'utf8'))
  .join('\n');
// class="…" · classList.…(…) · className=… 에 적힌 것.
const inUse = new Set();
for (const [chunk] of codeText.matchAll(/class="[^"]*"|classList\.\w+\([^)]*\)|className[^;]*/g))
  for (const [word] of chunk.matchAll(/[A-Za-z][\w-]*/g)) inUse.add(word);
// 클래스 이름을 값에서 만드는 곳도 있다 — class="rst ${r.status}" 처럼.
// 그 값들은 한 낱말짜리 문자열 리터럴로 어딘가에 적혀 있다. 넓게 잡아 오탐을 없앤다.
// 대신 「어디에도 그 낱말이 없는」 클래스만 잡히므로 검사는 느슨해진다 — 그래도 없는 것보다 낫다.
for (const [, word] of codeText.matchAll(/['"`]([A-Za-z][\w-]*)['"`]/g)) inUse.add(word);

// .leaflet-* 은 Leaflet이 직접 붙인다
const deadCss = [...declared].filter(c => !inUse.has(c) && !c.startsWith('leaflet')).sort();
for (const c of deadCss) console.error(`  css: 안 쓰임 — .${c}`);
if (deadCss.length) {
  console.error(`\n아무도 쓰지 않는 CSS 클래스 ${deadCss.length}종. 지우거나, 쓰는 곳을 만드세요.`);
  failed = true;
} else console.log(`  css: 클래스 ${[...declared].filter(c => !c.startsWith('leaflet')).length}종 전부 쓰입니다`);

if (failed) process.exit(1);
