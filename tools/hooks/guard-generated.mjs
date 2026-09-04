// PreToolUse(Edit|Write|MultiEdit) — 생성물 경로 편집 차단 (exit 2). 원천을 고치고 `pnpm ssot:build` / `pnpm tokens:build`.
import { readInput, relPath, GENERATED, block } from './_lib.mjs';
const input = readInput();
const p = relPath(input?.tool_input?.file_path);
if (p && GENERATED.some((g) => p.startsWith(g))) block(`[guard-generated] ${p} 은(는) 생성물입니다. 원천(ssot/*.yaml · packages/tokens/src)을 고치고 build를 실행하세요.`);
