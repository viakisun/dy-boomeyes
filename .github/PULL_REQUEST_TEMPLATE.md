## What / Why

-

## Refs

Refs: <!-- SCR-B1-02 FR-012 DISC-040 — 커밋 트레일러와 동일 -->

## How to test

```
pnpm verify
```

## 게이트 출력

```
✓ ssot: …
✓ DY: tokens …
```

## Checklist

- [ ] spec의 수용 기준(AC) 충족 · `data-scr` 부여
- [ ] 생성물(`docs/generated` · `packages/domain/src/generated` · `packages/tokens/dist`) 재생성 후 커밋
- [ ] 캡처/프리뷰 링크 (웨이브 0 이후)
- [ ] 되돌리기 어려운 결정은 ADR, 범위 변경은 DISC
