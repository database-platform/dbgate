<script context="module">
  function getCommandTitle(command) {
    let res = command.text;
    if (command.keyText || command.keyTextFromGroup) {
      res += ` (${formatKeyText(command.keyText || command.keyTextFromGroup)})`;
    }
    return res;
  }
</script>

<script lang="ts">
  import { t } from 'svelte-i18n';
  import { commandsCustomized } from '../stores';
  import { formatKeyText } from '../utility/common';
  import ToolStripButton from './ToolStripButton.svelte';

  export let command;
  export let component = ToolStripButton;
  export let hideDisabled = false;
  export let buttonLabel = null;

  const getI18n = (id, text) => {
    console.log(id, text);
    if (id) {
      return $t(`command.${id}`);
    }
    return text;
  };

  $: cmd = Object.values($commandsCustomized).find((x: any) => x.id == command) as any;
</script>

{#if cmd && (!hideDisabled || cmd.enabled)}
  <svelte:component
    this={component}
    title={getCommandTitle(cmd)}
    icon={cmd.icon}
    on:click={cmd.onClick}
    disabled={!cmd.enabled}
    {...$$restProps}
  >
    {buttonLabel || getI18n(cmd.id, cmd.toolbarName || cmd.name)}
  </svelte:component>
{/if}
