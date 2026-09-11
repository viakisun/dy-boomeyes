<script lang="ts">
  import { ownerHref, type OwnerCamera, type OwnerViewProps } from '@boomeyes/domain';
  import { Button, fmtDateTime, fmtDuration, connectivity } from '@boomeyes/ui';
  import { onDestroy } from 'svelte';
  let { data, api, app, url, navigate, capture = false }: OwnerViewProps = $props();
  const deviceId = $derived(decodeURIComponent(url.pathname.split('/').at(-2) ?? ''));
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
        if (result.deviceId !== expectedDevice) throw new Error('카메라와 장비가 다릅니다.');
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
  <header class="gap-stack-md flex flex-wrap items-start justify-between">
    <div class="gap-stack-sm flex flex-col">
      <p class="text-label-md text-fg-muted">현장 확인</p>
      <h1 class="text-heading-xl">{device ? `${device.unit}호기 영상` : '장비 영상'}</h1>
      {#if device}<p class="text-body-md text-fg-muted">{device.site}</p>{/if}
    </div>
    {#if device}<Button
        variant="outline"
        tone="neutral"
        class="min-h-size-touch-min"
        onclick={() => {
          video?.pause();
          navigate(ownerHref(url, 'detail', app, {}, deviceId));
        }}>장비 상세로</Button
      >{/if}
  </header>
  {#if !device}
    <p class="text-body-md text-danger-fg" role="alert">이 장비의 영상에 접근할 수 없습니다.</p>
  {:else}
    <section class="border-border rounded-card bg-surface min-w-0 overflow-hidden border" aria-label="영상 선택">
      <div class="p-inset-lg gap-stack-lg flex flex-col">
        <div class="gap-stack-sm flex flex-col">
          <h2 class="text-heading-sm">확인할 위치</h2>
          <div class="gap-inline-sm flex flex-wrap" role="group" aria-label="영상 용도">
            <Button
              class="min-h-size-touch-min"
              variant={purpose === 'pour' ? 'solid' : 'outline'}
              tone={purpose === 'pour' ? 'accent' : 'neutral'}
              aria-pressed={purpose === 'pour'}
              onclick={() => select({ purpose: 'pour' })}>타설 위치</Button
            >
            <Button
              class="min-h-size-touch-min"
              variant={purpose === 'install' ? 'solid' : 'outline'}
              tone={purpose === 'install' ? 'accent' : 'neutral'}
              aria-pressed={purpose === 'install'}
              onclick={() => select({ purpose: 'install' })}>마스트 설치</Button
            >
          </div>
        </div>
        <div class="gap-stack-sm flex flex-col">
          <h2 class="text-heading-sm">영상 시점</h2>
          <div class="gap-inline-sm flex flex-wrap" role="group" aria-label="영상 시점">
            <Button
              class="min-h-size-touch-min"
              variant={mode === 'live' ? 'solid' : 'outline'}
              tone={mode === 'live' ? 'accent' : 'neutral'}
              aria-pressed={mode === 'live'}
              onclick={() => select({ mode: 'live' })}>실시간 예시</Button
            >
            <Button
              class="min-h-size-touch-min"
              variant={mode === 'recorded' ? 'solid' : 'outline'}
              tone={mode === 'recorded' ? 'accent' : 'neutral'}
              aria-pressed={mode === 'recorded'}
              onclick={() => select({ mode: 'recorded', date: candidate?.operatingDay ?? '' })}>가동일 저장</Button
            >
            <Button
              class="min-h-size-touch-min"
              variant={mode === 'snapshot' ? 'solid' : 'outline'}
              tone={mode === 'snapshot' ? 'accent' : 'neutral'}
              aria-pressed={mode === 'snapshot'}
              onclick={() => select({ mode: 'snapshot' })}>스냅샷</Button
            >
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
        <div class="bg-surface-sunken p-inset-xl text-body-md" role="status" aria-busy="true">
          영상을 준비하는 중입니다.
        </div>
      {:else if error}
        <div class="gap-stack-md p-inset-xl flex flex-col items-start" role="alert">
          <p class="text-body-md">{error}</p>
          <Button class="min-h-size-touch-min" onclick={() => retry++}>다시 불러오기</Button>
        </div>
      {:else if !camera || !camera.available}
        <div class="bg-surface-sunken p-inset-xl gap-stack-sm flex flex-col">
          <h2 class="text-heading-sm">{device.connection === 'detached' ? '단말기 미장착' : '영상 미확보'}</h2>
          <p class="text-body-md text-fg-muted">
            {device.connection === 'detached'
              ? '장비에 단말기가 장착되면 영상을 확인할 수 있습니다.'
              : '이 위치에 등록된 영상이 없습니다.'}
          </p>
        </div>
      {:else if missingDate}
        <div class="bg-surface-sunken p-inset-xl gap-stack-sm flex flex-col">
          <h2 class="text-heading-sm">선택한 가동일의 저장 영상이 없습니다</h2>
          <p class="text-body-md text-fg-muted">영상이 등록된 {camera.operatingDay}을 선택해 주세요.</p>
        </div>
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
              <span
                class="bg-media-scrim text-media-fg text-label-md rounded-pill px-inset-sm py-inset-xs top-stack-sm left-stack-sm absolute"
                >시연 영상 · {purposeLabel}</span
              >
            </div>
            {#if mode !== 'snapshot'}
              <div class="p-inset-lg gap-stack-md flex flex-wrap items-center">
                <Button class="min-h-size-touch-min" variant="outline" tone="neutral" onclick={play}
                  >{ended ? '다시 재생' : paused ? '재생' : '일시정지'}</Button
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
          <div class="border-border p-inset-lg gap-stack-xs flex flex-col border-t">
            <h2 class="text-heading-sm">{purposeLabel} · {modeLabel}</h2>
            <p class="text-body-md text-fg-muted">
              {mode === 'recorded'
                ? `저장 시각 ${fmtDateTime(camera.recordedAt)} · ${fmtDuration(camera.durationSec)}`
                : `시연 기준 ${fmtDateTime(data.at)}`}
            </p>
            <p class="text-body-sm text-fg-muted">
              {mode === 'live'
                ? '6초 샘플을 반복 재생하는 실시간 화면 예시입니다.'
                : mode === 'recorded'
                  ? '가동일에 저장된 6초 샘플입니다. 영상 끝에서 재생이 멈춥니다.'
                  : '시연용 영상의 한 프레임입니다.'}
            </p>
          </div>
        </section>
      {/if}
    </section>
    {#if !connectivity.online}<p class="text-body-md text-warning-fg" role="status">
        오프라인입니다. 새로운 영상을 불러오려면 다시 연결해 주세요.
      </p>{/if}
  {/if}
</div>
