<script lang="ts">
  // A2-05 내 서류 — 유형·상태·만료 D-n · expiring/rejected만 "촬영·제출"(IF-011, mock objectURL) (specs/documents AC-1 · AC-2)
  import { invalidateAll } from '$app/navigation';
  import { SCR, type Doc } from '@boomeyes/domain';
  import { Button, DocumentCard, EmptyState, FileUpload, dueLabel, toast } from '@boomeyes/ui';
  import { session } from '$lib/session.svelte';
  let { data } = $props();
  let target = $state<Doc | null>(null);
  let picked = $state<{ name: string; type?: string; size?: number; url?: string } | null>(null);
  let busy = $state(false);
  const now = $derived(data.clock.now());
  const canSubmit = (d: Doc) => d.state === 'expiring' || d.state === 'rejected';
  // 개인 서류(운전자 본인)와 배정 장비 서류(예: 제작증)를 구분해 보여준다(화면 검수 §5) — Doc에 별도 구분 필드가 없어 subjectId로 판별
  const personal = $derived(data.docs.filter((d) => d.subjectId === data.me?.id));
  const equipment = $derived(data.docs.filter((d) => d.subjectId !== data.me?.id));
  async function submit() {
    if (!target || !picked) return;
    busy = true;
    try {
      const d = await data.api.submitDoc(
        target.id,
        { name: picked.name, type: picked.type ?? 'image/*', size: picked.size ?? 0, url: picked.url },
        session.user?.userId ?? 'driver03',
      );
      await invalidateAll();
      toast(d.pending ? `저장됨 — ${target.subject} 연결되면 전송` : `제출 — ${target.subject} (검토 대기)`);
      target = null;
      picked = null;
    } catch (e) {
      toast(`제출 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
</script>

{#snippet docList(list: Doc[], listLabel: string)}
  <ul class="gap-stack-sm flex flex-col" aria-label={listLabel}>
    {#each list as d (d.id)}
      <li>
        <DocumentCard doc={d} due={d.expiresAt ? dueLabel(d.expiresAt, now) : undefined} selected={target?.id === d.id}>
          {#snippet actions()}
            {#if canSubmit(d)}
              {#if target?.id === d.id}
                <FileUpload mode="image" label="서류 사진" onfile={(f) => (picked = f)} disabled={busy} />
                <Button size="lg" block disabled={busy || !picked} onclick={submit}
                  >{d.state === 'rejected' ? '재제출' : '제출'}</Button
                >
                <Button
                  size="lg"
                  block
                  variant="ghost"
                  tone="neutral"
                  onclick={() => ((target = null), (picked = null))}>취소</Button
                >
              {:else}
                <Button size="lg" block variant="outline" tone="neutral" onclick={() => (target = d)}
                  >{d.state === 'rejected' ? '재제출' : '촬영·제출'}</Button
                >
              {/if}
            {/if}
          {/snippet}
        </DocumentCard>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="gap-stack-lg flex flex-col" data-scr={SCR['A2-05']}>
  <p class="text-body-sm text-fg-muted">서류 {data.docs.length} · 만료 임박·반려 서류만 촬영해 제출합니다</p>
  {#if data.docs.length}
    {#if personal.length}
      <section class="gap-stack-sm flex flex-col" aria-label="개인 서류">
        <h2 class="text-heading-sm">개인 서류 {personal.length}</h2>
        {@render docList(personal, '개인 서류')}
      </section>
    {/if}
    {#if equipment.length}
      <section class="gap-stack-sm flex flex-col" aria-label="배정 장비 서류">
        <h2 class="text-heading-sm">배정 장비 서류 {equipment.length}</h2>
        {@render docList(equipment, '배정 장비 서류')}
      </section>
    {/if}
  {:else}
    <EmptyState title="등록된 서류가 없습니다" description="관리자가 서류를 등록하면 여기에 보입니다." />
  {/if}
</div>
