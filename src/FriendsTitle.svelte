<script>
  const letters = ['F','R','I','E','N','D','S'];

  // 6 dots between 7 letters, order from the original logo
  const dotColors = ['#e91e23','#02b2e7','#fabc16','#e91e23','#fabc16','#02b2e7'];
</script>

<span class="friends-logo" aria-label="Friends">
  {#each letters as letter, i}
    <span class="letter">{letter}</span>
    {#if i < letters.length - 1}
      <span class="dot" style="color: {dotColors[i]}">&#x2022;</span>
    {/if}
  {/each}
</span>

<style>
  .friends-logo {
    font-family: 'Friends';
    color: #fff;
    text-shadow: 2px 2px 0px #000;
    display: inline-flex;
    align-items: center;
    gap: 0;
    line-height: 1;
  }

  .letter {
    display: inline-block;
  }

  .dot {
    font-family: 'Inter';
    font-size: 0.75em;
    display: inline-block;
    vertical-align: middle;
    position: relative;
    margin: 0 0.12em;
    margin-left: 0.3em;
  }
</style>

