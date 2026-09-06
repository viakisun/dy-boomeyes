<script lang="ts">
  // 알림 기준 행(표형, DY-design §11.3) — <tr>: 종류 · 등급 · 수신 역할(토글 칩) · 임계(접근/초과) · 사용. 편집은 onchange로 부모 상태에 반영 (B4-05)
  import type { AlertRule, RoleId, Severity } from '@boomeyes/domain';
  import { cx, FOCUS, SEVERITY_TONE, TONE } from '../lib/cx';
  import { SEVERITY_LABEL } from '../lib/labels';
  import Switch from './Switch.svelte';
  let {
    rule,
    roles,
    disabled = false,
    onchange,
  }: {
    rule: AlertRule;
    roles: { id: RoleId; label: string }[];
    disabled?: boolean;
    onchange?: (rule: AlertRule) => void;
  } = $props();
  const SEVERITIES: Severity[] = ['critical', 'warning', 'info'];
  const emit = (patch: Partial<AlertRule>) => onchange?.({ ...rule, ...patch });
  const toggleRole = (id: RoleId) =>
    emit({ roles: rule.roles.includes(id) ? rule.roles.filter((r) => r !== id) : [...rule.roles, id] });
  const field = 'h-size-control-sm rounded-control border-border bg-surface px-inset-sm text-body-sm border';
  const cell = 'px-inset-md py-inset-xs align-middle';
</script>

<tr class={cx('border-border-subtle border-b last:border-b-0', !rule.enabled && 'opacity-60')} data-kind={rule.kind}>
  <th scope="row" class={cx(cell, 'text-body-md text-left font-medium whitespace-nowrap')}>{rule.label}</th>
  <td class={cx(cell, 'whitespace-nowrap')}>
    <select
      class={cx(field, TONE[SEVERITY_TONE[rule.severity]].fg, FOCUS)}
      value={rule.severity}
      {disabled}
      aria-label="{rule.label} 등급"
      onchange={(e) => emit({ severity: e.currentTarget.value as Severity })}
    >
      {#each SEVERITIES as s (s)}<option value={s}>{SEVERITY_LABEL[s]}</option>{/each}
    </select>
  </td>
  <td class={cell}>
    <div class="gap-inline-xs flex flex-wrap items-center" role="group" aria-label="{rule.label} 수신 역할">
      {#each roles as r (r.id)}
        <button
          type="button"
          class={cx(
            'h-size-badge rounded-pill px-inset-sm text-label-sm border',
            rule.roles.includes(r.id)
              ? 'border-accent-border bg-accent-bg text-accent-fg'
              : 'border-border text-fg-muted',
            FOCUS,
          )}
          aria-pressed={rule.roles.includes(r.id)}
          {disabled}
          onclick={() => toggleRole(r.id)}>{r.label}</button
        >
      {/each}
    </div>
  </td>
  <td class={cx(cell, 'whitespace-nowrap')}>
    {#if rule.threshold}
      {@const th = rule.threshold}
      <div class="gap-inline-xs text-label-md text-fg-muted flex items-center">
        <input
          type="number"
          step="0.01"
          class={cx(field, 'w-layout-field-short tabular-nums')}
          value={th.caution}
          {disabled}
          aria-label="{rule.label} 임계 접근"
          onchange={(e) => emit({ threshold: { ...th, caution: Number(e.currentTarget.value) } })}
        />
        <span aria-hidden="true">/</span>
        <input
          type="number"
          step="0.01"
          class={cx(field, 'w-layout-field-short tabular-nums')}
          value={th.danger}
          {disabled}
          aria-label="{rule.label} 임계 초과"
          onchange={(e) => emit({ threshold: { ...th, danger: Number(e.currentTarget.value) } })}
        />
        <span>{th.unit}</span>
      </div>
    {:else}<span class="text-fg-muted">—</span>{/if}
  </td>
  <td class={cx(cell, 'whitespace-nowrap')}>
    <Switch
      checked={rule.enabled}
      {disabled}
      label="{rule.label} 사용"
      hideLabel
      onchange={() => emit({ enabled: !rule.enabled })}
    />
  </td>
</tr>
