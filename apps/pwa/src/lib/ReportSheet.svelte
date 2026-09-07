<script lang="ts">
  // 현장 신고 시트(FR-038 제안 · 참고자료 v5.0 §12~14 "초도 확인은 현장 신고·영상 확인") — 유형 · 설명(필수) · 카메라 · 영상 시점 저장 → createReport → 업무+알림
  import { invalidateAll } from '$app/navigation';
  import type { ApiClient, Camera, Case, Device, ReportType } from '@boomeyes/domain';
  import { BottomSheet, Button, Checkbox, REPORT_TYPE_LABEL, Select, TextField, fmtTime, toast } from '@boomeyes/ui';
  let {
    open = $bindable(false),
    devices,
    cameras,
    deviceId,
    api,
    clock,
    by,
    onsubmitted,
  }: {
    open?: boolean;
    devices: Device[];
    cameras: Camera[];
    /** 고정 장비(A1-05) — 없으면 선택(A1-04) */
    deviceId?: string;
    api: ApiClient;
    clock: { iso(): string };
    by: string;
    onsubmitted?: (c: Case) => void;
  } = $props();
  const TYPES = (Object.keys(REPORT_TYPE_LABEL) as ReportType[]).map((value) => ({
    value,
    label: REPORT_TYPE_LABEL[value],
  }));
  let device = $state(deviceId ?? devices[0]?.id ?? '');
  let type = $state<ReportType>('worker');
  let cameraId = $state('');
  let note = $state('');
  let saveAt = $state(true);
  let busy = $state(false);
  const camOptions = $derived([
    { value: '', label: '선택 안 함' },
    ...cameras
      .filter((c) => c.deviceId === device)
      .map((c) => ({ value: c.id, label: `${c.id} · ${c.kind === 'ai' ? 'AI · 붐 끝' : '일반 · 전방'}` })),
  ]);
  const videoAt = $derived(clock.iso());
  async function submit() {
    if (!note.trim()) {
      toast('신고 내용을 입력하세요');
      return;
    }
    busy = true;
    try {
      const c = await api.createReport({
        deviceId: $state.snapshot(device),
        type: $state.snapshot(type),
        note: $state.snapshot(note),
        ...(cameraId ? { cameraId: $state.snapshot(cameraId) } : {}),
        ...(saveAt ? { videoAt } : {}),
        by,
      });
      await invalidateAll();
      toast(`신고 — ${c.id} · 업무함에 등록`);
      open = false;
      note = '';
      cameraId = '';
      onsubmitted?.(c);
    } catch (e) {
      toast(`신고 실패 — ${(e as Error).message}`, { tone: 'danger' });
    } finally {
      busy = false;
    }
  }
</script>

<BottomSheet bind:open title="현장 신고" capture onclose={() => (open = false)}>
  <div class="gap-stack-sm flex flex-col" data-report-sheet>
    <p class="text-body-sm text-fg-muted" data-ref="DISC-050 DISC-042">
      신고는 업무함에 현장 신고 업무로 등록되고 관제에 알림이 갑니다 · 자동 감지 전에는 눈으로 본 상황을 먼저 알립니다
    </p>
    {#if !deviceId}<Select
        label="장비"
        bind:value={device}
        options={devices.map((d) => ({ value: d.id, label: `${d.id} · ${d.unitNo}호기` }))}
      />{/if}
    <Select label="유형" bind:value={type} options={TYPES} />
    <Select label="카메라" bind:value={cameraId} options={camOptions} />
    <TextField label="내용" bind:value={note} placeholder="예: 호스 옆 작업자 쓰러짐 — 영상 확인 요청" required />
    <Checkbox bind:checked={saveAt} label="영상 시점 저장 ({fmtTime(videoAt)})" />
  </div>
  {#snippet footer()}
    <Button size="lg" block disabled={busy} onclick={submit}>신고</Button>
    <Button size="lg" block variant="ghost" tone="neutral" onclick={() => (open = false)}>닫기</Button>
  {/snippet}
</BottomSheet>
