// PostToolUse(Edit|Write|MultiEdit) — 편집 경로별 게이트 자동 실행. 실패 시 요약을 stderr로 (exit 2 = Claude 피드백)
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, readInput, relPath } from './_lib.mjs';
const p = relPath(readInput()?.tool_input?.file_path);
if (!p) process.exit(0);
const jobs = [];
if (p.startsWith('ssot/')) jobs.push(['tools/ssot/check.mjs'], ['tools/ssot/build.mjs']);
else if (p.startsWith('packages/tokens/src/')) jobs.push(['packages/tokens/scripts/check.mjs']);
else if (p.startsWith('specs/')) jobs.push(['tools/ssot/check.mjs', '--specs']);
else if (p.endsWith('.md') && (p.startsWith('docs/') || !p.includes('/'))) jobs.push(['tools/ssot/check.mjs', '--docs']);
for (const [script, ...args] of jobs) {
  if (!existsSync(join(ROOT, script))) continue; // 부트스트랩 중
  const r = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: 'utf8', timeout: 80_000 });
  if (r.status !== 0) { process.stderr.write(`[on-edit] ${script} ${args.join(' ')} 실패 (${p})\n${(r.stdout + r.stderr).split('\n').slice(-25).join('\n')}\n`); process.exit(2); }
  process.stdout.write(`[on-edit] ${script} ${args.join(' ')} ✓ ${(r.stdout || '').trim().split('\n').pop() ?? ''}\n`);
}
