<script lang="ts">
  export let clickable = false;
</script>

<div on:click class:clickable>
  <slot />
</div>

<style>
  div {
    padding: 16px;
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--theme-font-2);
    background-color: var(--theme-bg-1);
  }
  div.clickable:hover {
    background-color: var(--theme-bg-2);
  }
</style>
