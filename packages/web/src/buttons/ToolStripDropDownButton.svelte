<script lang="ts">
  import { t } from 'svelte-i18n';
  import FontIcon from '../icons/FontIcon.svelte';

  import { currentDropDownMenu } from '../stores';

  import ToolStripButton from './ToolStripButton.svelte';

  export let menu;
  export let title = undefined;
  export let label;
  export let icon;
  export let component = ToolStripButton;

  function handleClick(e) {
    // const rootStyle = window.document.documentElement.style;
    // const microLeft = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-left')) || 0;
    // const microTop = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-top')) || 0;
    const rect = e.detail.target.getBoundingClientRect();
    const left = rect.left;
    const top = rect.bottom;
    currentDropDownMenu.set({ left, top, items: menu });
  }
</script>

<svelte:component this={component} {title} {icon} on:click={handleClick}>
  {$t(label)}
  <FontIcon icon="icon chevron-down" />
</svelte:component>
