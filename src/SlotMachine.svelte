<script>
  import { createEventDispatcher, onDestroy } from 'svelte';


  export let pool;
  let active = false;

  const dispatch = createEventDispatcher();

  let slotEpisode = null;
  let timeouts = [];

  export function start() {
    if (active) return;
    active = true;

    const target = pool[Math.floor(Math.random() * pool.length)];
    const schedule = [
      ...Array(20).fill(50),
      ...Array(10).fill(100),
      ...Array(6).fill(180),
      ...Array(4).fill(320),
      500, 700, 950
    ];

    let accumulated = 0;
    schedule.forEach((delay, i) => {
      accumulated += delay;
      timeouts.push(setTimeout(() => {
        if (i < schedule.length - 1) {
          slotEpisode = pool[Math.floor(Math.random() * pool.length)];
        } else {
          slotEpisode = null;
          active = false;
          dispatch('picked', target);
        }
      }, accumulated));
    });
  }

  export function stop() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
    slotEpisode = null;
    active = false;
  }

  onDestroy(stop);
</script>

{#if slotEpisode}
  <div class="episodes picked-result">
    <div class="ep-card picked slot">
      <p class="ep-title">{slotEpisode.title}</p>
      <p class="ep-date">{slotEpisode.date}</p>
      <p class="ep-meta">Season {slotEpisode.season}, Episode {slotEpisode.episode}</p>
    </div>
  </div>
{/if}
