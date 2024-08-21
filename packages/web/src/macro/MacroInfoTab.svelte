<script lang="ts">
  import { getContext } from 'svelte';
  import { t } from 'svelte-i18n';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import WidgetTitle from '../widgets/WidgetTitle.svelte';
  import MacroParameters from './MacroParameters.svelte';

  const selectedMacro = getContext('selectedMacro') as any;

  export let onExecute;
</script>

<div class="wrapper">
  <div class="section">
    <WidgetTitle>{$t('widgets.macro.info.execute')}</WidgetTitle>
    <FormStyledButton value={$t('widgets.macro.info.execute')} on:click={onExecute} />
  </div>

  <div class="section">
    <WidgetTitle>{$t('widgets.macro.info.parameters')}</WidgetTitle>
    {#if $selectedMacro?.args && $selectedMacro?.args?.length > 0}
      {#key $selectedMacro?.name}
        <MacroParameters args={$selectedMacro?.args || []} namePrefix={`${$selectedMacro?.name}#`} />
      {/key}
    {:else}
      <div class="m-1">{$t('widgets.macro.info.parametersDescription')}</div>
    {/if}
  </div>

  <div class="section">
    <WidgetTitle>{$t('widgets.macro.info.description')}</WidgetTitle>
    <div class="m-1">{$selectedMacro?.description}</div>
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    overflow-y: auto;
  }
  .section {
    margin: 5px;
  }
</style>
