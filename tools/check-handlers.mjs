// 인라인 on*= 가 부르는 이름이 그 앱의 window에 실제로 얹혀 있는지 앱마다 검사한다.
// 이 어긋남은 런타임에 ReferenceError로만 드러나서 클릭이 조용히 죽는다 — 이번 작업에서 세 번 겪었다.
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

/** main.ts 끝에서 window에 얹은 이름 */
function exposedIn(mainFile) {
  const block = readFileSync(mainFile, 'utf8').match(/Object\.assign\(window as any, \{([\s\S]*?)\n\}\)/);
  if (!block) throw new Error(`${mainFile} 에서 window에 얹는 자리를 찾지 못했다`);
  return new Set(
    block[1]
      .split(',')
      .map(s => s.trim().split(':')[0].trim())
      .filter(Boolean),
  );
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
  const missing = [...called].filter(([name]) => !exposed.has(name) && !BUILTIN.has(name));
  const unused = [...exposed].filter(name => !called.has(name));

  for (const [name, file] of missing) console.error(`  ${app}: 없음 — ${name}()  ← ${file} 가 부른다`);
  for (const name of unused) console.warn(`  ${app}: 안 쓰임 — ${name}`);
  if (missing.length) failed = true;
  else console.log(`  ${app}: 인라인 핸들러 ${called.size}개 전부 window에 있습니다 (${shell})`);
}

if (failed) process.exit(1);
