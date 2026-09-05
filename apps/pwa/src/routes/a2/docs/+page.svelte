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
  async function submit() {
    if (!target || !picked) return;
    busy = true;
    try {
      await data.api.submitDoc(
        target.id,
        { name: picked.name, type: picked.type ?? 'image/*', size: picked.size ?? 0, url: picked.url },
        session.user?.userId ?? 'driver03',
      );
      await invalidateAll();
      toast(`제출 — ${target.subject} (검토 대기)`);
      target = null;
      picked = null;
    } catch (e) {
      toast(`제출 실패 — ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }
</script>

<div class="gap-stack-md flex flex-col" data-scr={SCR['A2-05']}>
  <p class="text-body-sm text-fg-muted">서류 {data.docs.length} · 만료 임박·반려 서류만 촬영해 제출합니다</p>
  {#if data.docs.length}
    <ul class="gap-stack-sm flex flex-col" aria-label="서류">
      {#each data.docs as d (d.id)}
        <li>
          <DocumentCard
            doc={d}
            due={d.expiresAt ? dueLabel(d.expiresAt, now) : undefined}
            selected={target?.id === d.id}
          >
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
  {:else}
    <EmptyState title="등록된 서류가 없습니다" description="관리자가 서류를 등록하면 여기에 보입니다." />
  {/if}
</div>
