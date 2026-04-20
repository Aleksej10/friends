<script>
  import { onDestroy, tick } from 'svelte';
  import FriendsTitle from '@/FriendsTitle.svelte';
  import rawData from '@/episodes.json';
  import SlotMachine from '@/SlotMachine.svelte';



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

  function episodeCount(n) {
    const words = ['One','Two','Three','Four'];
    const word = words[n - 1] ?? n;
    return `${word} ${n === 1 ? 'episode' : 'episodes'}`;
  }

  function relativeDay(days, from = new Date()) {
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    if (days === 1) return 'tomorrow';
    if (days === 2) return 'the day after tomorrow';
    if (days <= 6)  return `in ${days} days`;

    if (days <= 13) {
      const target = new Date(from);
      target.setDate(target.getDate() + days);
      return `next ${DAYS[target.getDay()]}`;
    }

    if (days === 14) return 'in two weeks';

    return `in ${days} days`;
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
      return `Yes! This episode first aired on this day${yearSuffix}`;
    }
    return `Yes! These ${episodeCount(episodes.length).toLowerCase()} first aired on this day${yearSuffix}`;
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let showNextEpisodes = false;

  let slotMachine;
  let slotActive = false;
  let pickedEpisode = null;

  async function startSlot() {
    pickedEpisode = null;
    slotActive = true;
    await tick();   
    slotMachine.start();
  }

  function resetSlot() {
    slotMachine.stop();
    slotActive = false;
    startSlot();
  }
</script>

<!-- =========================================================================
     Template
     ========================================================================= -->

<main>
  <!-- HEADER -->
  <header>
    <h1>
      SHOULD I WATCH<br>
      <FriendsTitle /><br>
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
      <h2 class="answer-no">Yes, but nothing aired on this day.</h2>

      {#if nextEntry}
        <p class="next-line">
          <button class="n-link" on:click={() => showNextEpisodes = !showNextEpisodes}
            aria-expanded={showNextEpisodes}>
            {episodeCount(nextCount)}
          </button>
          aired on {nextMonthDay}.
          <br class="mobile-br">
          <b>That's {relativeDay(daysUntilNext)}</b>.
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
        {#if !pickedEpisode }
          <br class="mobile-br">
        {/if}
        <span class="random-link" role="button" tabindex="0"
          class:hidden={slotActive}
          on:click={pickedEpisode ? resetSlot : startSlot}
          on:keydown={e => e.key === 'Enter' && (pickedEpisode ? resetSlot() : startSlot())}>
          {pickedEpisode ? 'Try again?' : 'Watch a random episode!'}
        </span>
      </p>

      <SlotMachine
        bind:this={slotMachine}
        pool={randomPool}
        on:picked={e => { pickedEpisode = e.detail; slotActive = false }}
      />

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
