<script lang="ts">
  import _ from 'lodash';

  import FontIcon from '../icons/FontIcon.svelte';
  import { currentDropDownMenu } from '../stores';
  import InlineButton from './InlineButton.svelte';

  export let icon = 'icon chevron-down';
  export let menu;
  export let narrow = false;
  let domButton;

  function handleClick() {
    const rootStyle = window.document.documentElement.style;
    const microLeft = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-left')) || 0;
    const microTop = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-top')) || 0;
    const rect = domButton.getBoundingClientRect();
    const left = rect.left - microLeft;
    const top = rect.bottom - microTop;
    currentDropDownMenu.set({ left, top, items: menu });
  }
</script>

<InlineButton square {narrow} on:click={handleClick} bind:this={domButton}>
  <FontIcon {icon} />
</InlineButton>
