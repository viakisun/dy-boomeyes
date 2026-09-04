// PreToolUse(Bash) — 위험 명령 차단 (exit 2): git add -A/--all/. · push --force · reset --hard · 안전 디렉터리 밖 rm -rf
import { readInput, block } from './_lib.mjs';
const cmd = String(readInput()?.tool_input?.command ?? '');
const RULES = [
  [/\bgit\s+add\s+(-A|--all|\.)(\s|$)/, 'git add -A/--all/. 금지 — 변경 파일을 명시해서 stage 하세요.'],
  [/\bgit\s+push\b[^|;&]*(--force|-f\b|--force-with-lease)/, 'force push 금지.'],
  [/\bgit\s+reset\s+--hard/, 'git reset --hard 금지 — stash 또는 checkout -- <file>.'],
  [/\bgit\s+commit\b[^|;&]*--no-verify/, '--no-verify 금지 — 게이트를 통과시키세요.'],
];
for (const [re, msg] of RULES) if (re.test(cmd)) block(`[guard-bash] ${msg}`);
const rm = /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+|-[a-zA-Z]*\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+)([^|;&\n]+)/.exec(cmd);
if (rm) {
  const targets = rm[2]
    .trim()
    .split(/\s+/)
    .filter((t) => !t.startsWith('-'));
  const SAFE =
    /^(\.\/)?(node_modules|dist|build|\.svelte-kit|\.turbo|coverage|\.venv|__pycache__)(\/|$)|\/(node_modules|dist|build|\.svelte-kit|\.turbo|coverage|__pycache__)(\/|$)/;
  if (targets.some((t) => !SAFE.test(t)))
    block(
      `[guard-bash] rm -r 대상이 안전 디렉터리(node_modules·dist·build·.svelte-kit·coverage) 밖입니다: ${targets.join(' ')}`,
    );
}
