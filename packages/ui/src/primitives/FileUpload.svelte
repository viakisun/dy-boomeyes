<script lang="ts">
  // 파일 업로드 — 드롭존 + 숨은 input. 텍스트 파일(YAML/JSON)만 읽어 onfile({ name, text })로 넘긴다
  import { cx, FOCUS } from '../lib/cx';
  let {
    accept = '.yaml,.yml,.json',
    label = '정의 파일 선택 또는 끌어다 놓기',
    hint = 'YAML · JSON',
    disabled = false,
    onfile,
    class: cls,
  }: {
    accept?: string;
    label?: string;
    hint?: string;
    disabled?: boolean;
    onfile?: (file: { name: string; text: string }) => void;
    class?: string;
  } = $props();
  let over = $state(false);
  const id = `fu-${Math.random().toString(36).slice(2, 8)}`;
  async function take(files: FileList | null | undefined) {
    const f = files?.[0];
    if (!f || disabled) return;
    onfile?.({ name: f.name, text: await f.text() });
  }
</script>

<label
  for={id}
  class={cx(
    'rounded-card gap-stack-xs p-inset-lg flex cursor-pointer flex-col items-center border border-dashed text-center',
    over ? 'border-accent-border-strong bg-accent-bg-subtle' : 'border-border-strong bg-surface-sunken',
    disabled && 'pointer-events-none opacity-40',
    cls,
  )}
  ondragover={(e) => {
    e.preventDefault();
    over = true;
  }}
  ondragleave={() => (over = false)}
  ondrop={(e) => {
    e.preventDefault();
    over = false;
    take(e.dataTransfer?.files);
  }}
>
  <span class="text-body-md text-fg font-medium">{label}</span>
  <span class="text-label-sm text-fg-muted">{hint}</span>
  <input
    {id}
    type="file"
    {accept}
    {disabled}
    class={cx('sr-only', FOCUS)}
    onchange={(e) => {
      take(e.currentTarget.files);
      e.currentTarget.value = '';
    }}
  />
</label>
