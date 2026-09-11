<script lang="ts">
  import { ownerHref, ownerDetailReturn, type OwnerCamera, type OwnerViewProps } from '@boomeyes/domain';
  import {
    Button,
    Chip,
    EmptyState,
    IconTile,
    KeyValueList,
    PageHeader,
    Skeleton,
    StatusPill,
    IconPlay as Play,
    IconPause as Pause,
    IconRotateCcw as RotateCcw,
    IconVideoOff as VideoOff,
    fmtDateTime,
    fmtDuration,
    connectivity,
  } from '@boomeyes/ui';
  import { onDestroy } from 'svelte';
  let { data, api, app, url, navigate, capture = false }: OwnerViewProps = $props();
  const deviceId = $derived.by(() => {
    try {
      return decodeURIComponent(url.pathname.split('/').at(-2) ?? '');
    } catch {
      return '';
    }
  });
  const device = $derived(data.devices.find((item) => item.id === deviceId));
  const purpose = $derived(url.searchParams.get('purpose') === 'install' ? 'install' : 'pour');
  const mode = $derived(
    url.searchParams.get('mode') === 'recorded'
      ? 'recorded'
      : url.searchParams.get('mode') === 'snapshot'
        ? 'snapshot'
        : 'live',
  );
  const candidate = $derived(data.cameras.find((item) => item.deviceId === deviceId && item.purpose === purpose));
  const date = $derived(url.searchParams.get('date') ?? candidate?.operatingDay ?? '');
  const purposeLabel = $derived(purpose === 'pour' ? '타설 위치' : '마스트 설치');
  const modeLabel = $derived(mode === 'recorded' ? '가동일 저장' : mode === 'snapshot' ? '스냅샷' : '실시간 예시');
  let camera = $state<OwnerCamera | null>(null);
  let loading = $state(false);
  let error = $state('');
  let retry = $state(0);
  let mediaFailed = $state(false);
  let video = $state<HTMLVideoElement>();
  let paused = $state(true);
  let ended = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  const missingDate = $derived(mode === 'recorded' && date !== camera?.operatingDay);
  $effect(() => {
    const id = url.searchParams.get('camera') ?? candidate?.id;
    const expectedDevice = deviceId;
    const expectedPurpose = purpose;
    void retry;
    camera = null;
    loading = false;
    error = '';
    mediaFailed = false;
    if (!device || !id) return;
    let active = true;
    loading = true;
    api
      .camera(id)
      .then((result) => {
        if (!active) return;
        if (result.deviceId !== expectedDevice || result.purpose !== expectedPurpose)
          throw new Error('카메라와 장비·용도가 다릅니다.');
        camera = result;
      })
      .catch(() => {
        if (active) error = '이 장비의 영상에 접근할 수 없습니다.';
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });
  $effect(() => {
    void mode;
    void camera?.id;
    void date;
    currentTime = 0;
    duration = 0;
    ended = false;
    paused = true;
    mediaFailed = false;
  });
  $effect(() => {
    const player = video;
    return () => {
      if (!player) return;
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  });
  onDestroy(() => {
    video?.pause();
  });
  function select(values: Record<string, string>) {
    video?.pause();
    navigate(
      ownerHref(
        url,
        'video',
        app,
        {
          purpose,
          mode,
          date: mode === 'recorded' ? date : null,
          return: url.searchParams.get('return'),
          ...values,
        },
        deviceId,
      ),
    );
  }
  async function play() {
    if (!video) return;
    if (!paused) {
      video.pause();
      return;
    }
    if (ended) video.currentTime = 0;
    try {
      await video.play();
      ended = false;
    } catch {
      mediaFailed = true;
    }
  }
</script>

<div class="gap-stack-xl flex min-w-0 flex-col">
  <PageHeader title={device ? `${device.unit}호기 영상` : '장비 영상'}>
    {#snippet meta()}{#if device}<span class="text-body-sm text-fg-muted">{device.site}</span>{/if}{/snippet}
    {#snippet actions()}
      {#if device}<Button
          variant="outline"
          tone="neutral"
          onclick={() => {
            video?.pause();
            navigate(ownerDetailReturn(url, app, deviceId));
          }}>장비 상세로</Button
        >{/if}
    {/snippet}
  </PageHeader>
  {#if !device}
    <p class="text-body-md text-danger-fg" role="alert">이 장비의 영상에 접근할 수 없습니다.</p>
  {:else}
    <section class="rounded-card bg-surface shadow-raised min-w-0 overflow-hidden" aria-label="영상 선택">
      <div class="p-inset-md gap-stack-md flex flex-col">
        <div class="gap-inline-lg flex flex-wrap items-center">
          <div class="gap-inline-sm flex flex-wrap items-center" role="group" aria-label="영상 용도">
            <span class="text-label-md text-fg-muted">위치</span>
            <Chip size="md" selected={purpose === 'pour'} onclick={() => select({ purpose: 'pour' })}>타설 위치</Chip>
            <Chip size="md" selected={purpose === 'install'} onclick={() => select({ purpose: 'install' })}
              >마스트 설치</Chip
            >
          </div>
          <div class="gap-inline-sm flex flex-wrap items-center" role="group" aria-label="영상 시점">
            <span class="text-label-md text-fg-muted">시점</span>
            <Chip size="md" selected={mode === 'live'} onclick={() => select({ mode: 'live' })}>실시간 예시</Chip>
            <Chip
              size="md"
              selected={mode === 'recorded'}
              onclick={() => select({ mode: 'recorded', date: candidate?.operatingDay ?? '' })}>가동일 저장</Chip
            >
            <Chip size="md" selected={mode === 'snapshot'} onclick={() => select({ mode: 'snapshot' })}>스냅샷</Chip>
          </div>
        </div>
        {#if mode === 'recorded'}
          <div class="gap-stack-xs flex flex-col items-start">
            <label for="owner-recording-date" class="text-label-lg">가동일</label>
            <input
              id="owner-recording-date"
              type="date"
              value={date}
              onchange={(event) => select({ date: event.currentTarget.value })}
              class="border-border-strong bg-surface text-body-md px-inset-md min-h-size-touch-min rounded-control py-inset-sm focus-visible:outline-strong focus-visible:outline-focus-ring max-w-full min-w-0 border"
            />
            <p class="text-body-sm text-fg-muted">
              {candidate
                ? `${candidate.operatingDay} · ${fmtDuration(candidate.durationSec)} 시연 영상 1건`
                : '등록된 저장 영상이 없습니다.'}
            </p>
          </div>
        {/if}
      </div>
      {#if loading}
        <div class="bg-surface-sunken p-inset-md gap-stack-sm flex flex-col" role="status" aria-busy="true">
          <Skeleton shape="rect" class="aspect-video h-auto" /><span class="sr-only">영상을 준비하는 중입니다.</span>
        </div>
      {:else if error}
        <div class="gap-stack-md p-inset-xl flex flex-col items-start" role="alert">
          <p class="text-body-md">{error}</p>
          <Button class="min-h-size-touch-min" onclick={() => retry++}>다시 불러오기</Button>
        </div>
      {:else if !camera || !camera.available}
        <EmptyState title={device.connection === 'detached' ? '단말기 미장착' : '영상 미확보'} class="m-inset-md">
          {#snippet icon()}<IconTile><VideoOff class="size-size-icon-lg" /></IconTile>{/snippet}
        </EmptyState>
      {:else if missingDate}
        <EmptyState
          title="선택한 가동일의 저장 영상 없음"
          description="영상이 등록된 날짜: {camera.operatingDay}"
          class="m-inset-md"
        >
          {#snippet icon()}<IconTile><VideoOff class="size-size-icon-lg" /></IconTile>{/snippet}
        </EmptyState>
      {:else}
        <section data-camera={camera.id} data-mode={mode} aria-label="{device.unit}호기 {purposeLabel} {modeLabel}">
          {#if mediaFailed}
            <div class="p-inset-xl gap-stack-md flex flex-col items-start" role="alert">
              <h2 class="text-heading-sm">영상을 불러오지 못했습니다</h2>
              <p class="text-body-md text-fg-muted">연결 상태를 확인하고 다시 시도해 주세요.</p>
              <Button class="min-h-size-touch-min" onclick={() => retry++}>영상 다시 불러오기</Button>
            </div>
          {:else}
            <div class="bg-media-bg relative aspect-video w-full overflow-hidden">
              {#key `${camera.id}-${mode}-${date}-${retry}`}
                {#if mode === 'snapshot'}
                  <img
                    src={camera.poster}
                    class="h-full w-full object-contain"
                    alt="{device.unit}호기 {purposeLabel} 시연 스냅샷"
                    onerror={() => (mediaFailed = true)}
                  />
                {:else}
                  <video
                    bind:this={video}
                    src={camera.url}
                    poster={camera.poster}
                    class="h-full w-full object-contain"
                    muted
                    playsinline
                    preload="metadata"
                    autoplay={!capture}
                    loop={mode === 'live'}
                    aria-label="{device.unit}호기 {purposeLabel} {modeLabel}"
                    onplay={() => (paused = false)}
                    onpause={() => (paused = true)}
                    onended={() => {
                      ended = true;
                      paused = true;
                    }}
                    ontimeupdate={() => (currentTime = video?.currentTime ?? 0)}
                    onloadedmetadata={() => (duration = video?.duration ?? 0)}
                    onerror={() => (mediaFailed = true)}
                  ></video>
                {/if}
              {/key}
              <StatusPill
                solid
                tone="neutral"
                label="{purposeLabel} · {modeLabel}"
                class="top-stack-sm left-stack-sm absolute"
              />
            </div>
            {#if mode !== 'snapshot'}
              <div class="p-inset-lg gap-stack-md flex flex-wrap items-center">
                <Button variant="outline" tone="neutral" onclick={play}
                  >{#if ended}<RotateCcw class="size-size-icon-sm" aria-hidden="true" />{:else if paused}<Play
                      class="size-size-icon-sm"
                      aria-hidden="true"
                    />{:else}<Pause class="size-size-icon-sm" aria-hidden="true" />{/if}{ended
                    ? '다시 재생'
                    : paused
                      ? '재생'
                      : '일시정지'}</Button
                >
                <label class="gap-inline-sm text-body-sm flex min-w-0 flex-1 items-center">
                  <span class="sr-only">영상 재생 위치</span>
                  <input
                    type="range"
                    min="0"
                    max={Number.isFinite(duration) && duration > 0 ? duration : camera.durationSec}
                    step="0.1"
                    value={currentTime}
                    aria-label="영상 재생 위치"
                    class="min-h-size-touch-min accent-accent min-w-0 flex-1"
                    oninput={(event) => {
                      if (video) video.currentTime = Number(event.currentTarget.value);
                    }}
                  />
                  <span class="text-fg-muted whitespace-nowrap tabular-nums"
                    >{Math.floor(currentTime)} / {Math.round(duration || camera.durationSec)}초</span
                  >
                </label>
              </div>
            {/if}
          {/if}
          <div class="border-border-subtle p-inset-md border-t">
            <KeyValueList
              columns={2}
              items={[
                { label: '위치', value: purposeLabel },
                { label: '시점', value: modeLabel },
                mode === 'recorded'
                  ? { label: '저장 시각', value: fmtDateTime(camera.recordedAt) }
                  : { label: '기준 시각', value: fmtDateTime(data.at) },
                { label: '길이', value: mode === 'snapshot' ? '정지 화면' : `${fmtDuration(camera.durationSec)} 샘플` },
              ]}
            />
          </div>
        </section>
      {/if}
    </section>
    {#if !connectivity.online}<p class="text-body-md text-warning-fg" role="status">오프라인</p>{/if}
  {/if}
</div>
