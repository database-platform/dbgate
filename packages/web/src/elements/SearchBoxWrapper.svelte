<script lang="ts">
  import FontIcon from '../icons/FontIcon.svelte';

  export let styleName = '';
</script>

<div class="wrapper" style={styleName}>
  <FontIcon icon="icon magnify" style="position: absolute;margin: 6px;color:var(--theme-border)" />
  <slot />
</div>

<style>
  .wrapper {
    display: flex;
    /* border-bottom: 1px solid var(--theme-border); */
    margin: 8px;
  }
</style>
