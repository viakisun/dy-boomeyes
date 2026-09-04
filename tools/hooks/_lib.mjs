// _lib.mjs — hooks 공용: stdin JSON 읽기 · 리포 루트 · 경로 판정
import { readFileSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export function readInput() { try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; } }
export function relPath(p) { if (!p) return null; const abs = isAbsolute(p) ? p : resolve(process.cwd(), p); const r = relative(ROOT, abs); return r.startsWith('..') ? null : r.split('\\').join('/'); }
export const GENERATED = ['docs/generated/', 'packages/domain/src/generated/', 'packages/tokens/dist/'];
export function block(msg) { process.stderr.write(msg + '\n'); process.exit(2); }
