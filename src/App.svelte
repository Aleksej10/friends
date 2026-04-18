<script>
  import { onDestroy } from 'svelte';
  import rawData from './episodes.json';

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  const allEpisodes = rawData.flat();

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function parseMD(dateStr) {
    // "September 22, 1994" -> { month: 8, day: 22, year: 1994 }
    const parts = dateStr.split(' ');
    return {
      month: MONTHS.indexOf(parts[0]),
      day:   parseInt(parts[1]),
      year:  parseInt(parts[2])
    };
  }

  // ---------------------------------------------------------------------------
  // Today
  // ---------------------------------------------------------------------------

  const now   = new Date();
  const todayM = now.getMonth();
  const todayD = now.getDate();
  const todayMidnight = new Date(now.getFullYear(), todayM, todayD);

  const todayEpisodes = allEpisodes.filter(ep => {
    const { month, day } = parseMD(ep.date);
    return month === todayM && day === todayD;
  });

  // ---------------------------------------------------------------------------
  // Next upcoming anniversary date (strictly after today)
  // ---------------------------------------------------------------------------

  // Build map: "M-D" -> { month, day, episodes[] }
  const dateMap = {};
  for (const ep of allEpisodes) {
    const { month, day } = parseMD(ep.date);
    const key = `${month}-${day}`;
    if (!dateMap[key]) dateMap[key] = { month, day, episodes: [] };
    dateMap[key].episodes.push(ep);
  }

  let nextEntry = null;
  let daysUntilNext = Infinity;
  let nextCandidateDate = null;

  for (const v of Object.values(dateMap)) {
    let cand = new Date(now.getFullYear(), v.month, v.day);
    let diff = Math.round((cand - todayMidnight) / 86400000);
    if (diff <= 0) {
      cand = new Date(now.getFullYear() + 1, v.month, v.day);
      diff = Math.round((cand - todayMidnight) / 86400000);
    }
    if (diff < daysUntilNext) {
      daysUntilNext  = diff;
      nextEntry      = v;
      nextCandidateDate = cand;
    }
  }

  const nextMonthDay   = nextEntry ? `${MONTHS[nextEntry.month]} ${nextEntry.day}` : '';
  const nextDayOfWeek  = nextCandidateDate ? DAYS[nextCandidateDate.getDay()] : '';
  const nextCount      = nextEntry ? nextEntry.episodes.length : 0;

  // ---------------------------------------------------------------------------
  // Random pool: exclude next-date episodes
  // ---------------------------------------------------------------------------

  const nextEpisodeKeys = new Set(
    (nextEntry ? nextEntry.episodes : []).map(ep => `${ep.season}-${ep.episode}`)
  );
  const randomPool = allEpisodes.filter(
    ep => !nextEpisodeKeys.has(`${ep.season}-${ep.episode}`)
  );

  // ---------------------------------------------------------------------------
  // Today's header text
  // ---------------------------------------------------------------------------

  function buildTodayHeader(episodes) {
    const years = [...new Set(episodes.map(ep => parseMD(ep.date).year))].sort();
    const yearSuffix = years.length === 1
      ? ` in ${years[0]}`
      : years.length > 1 ? ` in ${years.slice(0,-1).join(', ')} and ${years[years.length-1]}` : '';
    if (episodes.length === 1) {
      return `Yes! This episode aired today${yearSuffix}`;
    }
    return `Yes! These ${episodes.length} episodes aired today${yearSuffix}`;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let showNextEpisodes = false;
  let slotActive       = false;
  let slotEpisode      = null;  // episode shown while spinning
  let pickedEpisode    = null;  // final result
  let timeouts         = [];

  function startSlot() {
    if (slotActive) return;
    slotActive       = true;
    pickedEpisode    = null;
    showNextEpisodes = false;

    const target = randomPool[Math.floor(Math.random() * randomPool.length)];

    // Build schedule: fast -> slow
    const schedule = [
      ...Array(20).fill(50),
      ...Array(10).fill(100),
      ...Array(6).fill(180),
      ...Array(4).fill(320),
      500, 700, 950
    ];

    let accumulated = 0;
    const total = schedule.length;

    schedule.forEach((delay, i) => {
      accumulated += delay;
      const t = setTimeout(() => {
        if (i < total - 1) {
          slotEpisode = randomPool[Math.floor(Math.random() * randomPool.length)];
        } else {
          slotEpisode   = null;
          pickedEpisode = target;
          slotActive    = false;
        }
      }, accumulated);
      timeouts.push(t);
    });
  }

  function resetSlot() {
    timeouts.forEach(clearTimeout);
    timeouts       = [];
    slotActive     = false;
    slotEpisode    = null;
    pickedEpisode  = null;
  }

  onDestroy(() => timeouts.forEach(clearTimeout));
</script>

<!-- =========================================================================
     Template
     ========================================================================= -->

<main>
  <!-- HEADER -->
  <header>
    <h1>
      SHOULD I WATCH
      <span class="friends-title">Friends</span>
      TODAY?
    </h1>
  </header>

  <!-- ANSWER -->
  <section class="answer">
    {#if todayEpisodes.length > 0}
      <!-- CASE 1: Episodes aired today -->
      <h2 class="answer-yes">{buildTodayHeader(todayEpisodes)}</h2>
      <div class="episodes">
        {#each todayEpisodes as ep}
          <div class="ep-card">
            <p class="ep-title">{ep.title}</p>
            <p class="ep-date">{ep.date}</p>
            <p class="ep-desc">{ep.desc}</p>
            <p class="ep-meta">Season {ep.season}, Episode {ep.episode}</p>
          </div>
        {/each}
      </div>
    {:else}
      <!-- CASE 2: Nothing today -->
      <h2 class="answer-no">Yes, but none aired on this day.</h2>

      {#if nextEntry}
        <p class="next-line">
          There {nextCount === 1 ? 'is' : 'are'}
          <button class="n-link" on:click={() => showNextEpisodes = !showNextEpisodes}
            aria-expanded={showNextEpisodes}>
            {nextCount} {nextCount === 1 ? 'episode' : 'episodes'}
          </button>
          that aired on {nextMonthDay}, that's in {daysUntilNext} {daysUntilNext === 1 ? 'day' : 'days'} on {nextDayOfWeek}.
        </p>

        {#if showNextEpisodes}
          <div class="episodes next-episodes">
            {#each nextEntry.episodes as ep}
              <div class="ep-card">
                <p class="ep-title">{ep.title}</p>
                <p class="ep-date">{ep.date}</p>
                <p class="ep-desc">{ep.desc}</p>
                <p class="ep-meta">Season {ep.season}, Episode {ep.episode}</p>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <p class="cant-wait">
        Can't wait that long?
        {#if !slotActive && !pickedEpisode}
          <span class="random-link" role="button" tabindex="0"
            on:click={startSlot}
            on:keydown={e => e.key === 'Enter' && startSlot()}>
            Watch a random episode!
          </span>
        {:else if pickedEpisode}
          <span class="random-link" role="button" tabindex="0"
            on:click={resetSlot}
            on:keydown={e => e.key === 'Enter' && resetSlot()}>
            Try again?
          </span>
        {/if}
      </p>

      <!-- Slot machine -->
      {#if slotActive && slotEpisode}
        <div class="slot-machine" aria-live="polite">
          <div class="slot-reel">
            <span class="slot-text">
              Season {slotEpisode.season}, Episode {slotEpisode.episode} &mdash; {slotEpisode.title}
            </span>
          </div>
        </div>
      {/if}

      <!-- Picked episode -->
      {#if pickedEpisode}
        <div class="episodes picked-result">
          <div class="ep-card picked">
            <p class="ep-title">{pickedEpisode.title}</p>
            <p class="ep-date">{pickedEpisode.date}</p>
            <p class="ep-desc">{pickedEpisode.desc}</p>
            <p class="ep-meta">Season {pickedEpisode.season}, Episode {pickedEpisode.episode}</p>
          </div>
        </div>
      {/if}
    {/if}
  </section>
</main>

<style>
  /*
   */
  @font-face {
    font-family: 'Friends';
    src: url('/friends.ttf') format('truetype');
    font-weight: normal;
    font-style:  normal;
  }

  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(html) {
    font-family: 'Inter', sans-serif;
    font-feature-settings: 'cv02','cv03','cv04','cv11';
    background: #fdf8f2;
    color: #1a1a1a;
  }

  :global(body) {
    min-height: 100vh;
  }

  /* -------------------------------------------------------------------------
     Layout
     ---------------------------------------------------------------------- */

  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px 96px;
  }

  /* -------------------------------------------------------------------------
     Header
     ---------------------------------------------------------------------- */

  header {
    text-align: center;
    margin-bottom: 56px;
    padding-bottom: 40px;
    border-bottom: 2px solid #f0e0cc;
  }

  h1 {
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.2;
    color: #1a1a1a;
    text-transform: uppercase;
  }

  .friends-title {
    font-family: 'Friends', 'Georgia', serif;
    font-size: 1.35em;
    color: #e8690a;
    letter-spacing: 0.02em;
    text-transform: none;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
  }

  /* -------------------------------------------------------------------------
     Answer section
     ---------------------------------------------------------------------- */

  .answer {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  h2 {
    font-size: clamp(1.25rem, 3vw, 1.75rem);
    font-weight: 700;
    line-height: 1.3;
  }

  .answer-yes {
    color: #1a1a1a;
  }

  .answer-no {
    color: #1a1a1a;
  }

  /* -------------------------------------------------------------------------
     Episode cards
     ---------------------------------------------------------------------- */

  .episodes {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .ep-card {
    background: #fff;
    border: 1px solid #f0e0cc;
    border-left: 4px solid #e8690a;
    border-radius: 8px;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ep-card.picked {
    border-left-color: #d4a017;
    background: #fffbf3;
  }

  .ep-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
  }

  .ep-date {
    font-size: 0.85rem;
    font-weight: 500;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ep-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #444;
  }

  .ep-meta {
    font-size: 0.82rem;
    font-weight: 600;
    color: #e8690a;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  /* -------------------------------------------------------------------------
     Next episodes line
     ---------------------------------------------------------------------- */

  .next-line {
    font-size: 1rem;
    line-height: 1.7;
    color: #444;
  }

  /* n-link: looks like inline text, underlined */
  .n-link {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    color: #e8690a;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 3px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .n-link:hover,
  .n-link:focus {
    color: #c45507;
    outline: none;
  }

  .next-episodes {
    margin-top: -8px;
  }

  /* -------------------------------------------------------------------------
     Can't wait / random link
     ---------------------------------------------------------------------- */

  .cant-wait {
    font-size: 1rem;
    color: #444;
    line-height: 1.7;
  }

  .random-link {
    font-weight: 600;
    color: #e8690a;
    text-decoration: underline;
    text-decoration-style: solid;
    text-underline-offset: 3px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .random-link:hover,
  .random-link:focus {
    color: #c45507;
    outline: none;
  }

  /* -------------------------------------------------------------------------
     Slot machine
     ---------------------------------------------------------------------- */

  .slot-machine {
    border: 2px solid #f0e0cc;
    border-radius: 8px;
    background: #fff;
    padding: 0;
    overflow: hidden;
  }

  .slot-reel {
    padding: 20px 28px;
    min-height: 68px;
    display: flex;
    align-items: center;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 33px,
      #fdf1e4 33px,
      #fdf1e4 34px
    );
  }

  .slot-text {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: 0.01em;
    animation: blur-in 0.08s ease-out;
  }

  @keyframes blur-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .picked-result {
    margin-top: -8px;
  }

  /* -------------------------------------------------------------------------
     Responsive
     ---------------------------------------------------------------------- */

  @media (max-width: 480px) {
    main {
      padding: 32px 16px 64px;
    }

    .ep-card {
      padding: 20px 20px;
    }

    .slot-reel {
      padding: 16px 20px;
    }
  }
</style>
