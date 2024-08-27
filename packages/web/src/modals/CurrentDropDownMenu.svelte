<script>
  import _ from 'lodash';
  import { afterUpdate } from 'svelte';
  import { currentDropDownMenu } from '../stores';
  import DropDownMenu from './DropDownMenu.svelte';

  let microLeft;
  let microTop;
  afterUpdate(() => {
    const rootStyle = window.document.documentElement.style;
    microLeft = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-left')) || 0;
    microTop = parseFloat(rootStyle.getPropertyValue('--dim-micro-app-top')) || 0;
  });
</script>

{#if $currentDropDownMenu}
  <DropDownMenu
    left={$currentDropDownMenu.left - microLeft}
    top={$currentDropDownMenu.top - microTop}
    items={$currentDropDownMenu.items}
    targetElement={$currentDropDownMenu.targetElement}
    on:close={() => ($currentDropDownMenu = null)}
  />
{/if}
