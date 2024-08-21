<script lang="ts">
  import { t } from 'svelte-i18n';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';

  export let tabs;
  export let onConfirm;
  export let onCancel;
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">{$t('modal.closeTabs.header')}</svelte:fragment>

    <div>
      {$t('modal.closeTabs.tip')}
      <FontIcon icon="icon history" />
      widget
    </div>

    {#each tabs as tab}
      <div class="ml-2"><FontIcon icon={tab.icon} /> {tab.title}</div>
    {/each}

    <svelte:fragment slot="footer">
      <FormSubmit
        value={$t('common.closeTabs')}
        on:click={() => {
          closeCurrentModal();
          onConfirm();
        }}
      />
      <FormStyledButton
        type="button"
        value={$t('common.cancel')}
        on:click={() => {
          closeCurrentModal();
          onCancel();
        }}
      />
    </svelte:fragment>
  </ModalBase>
</FormProvider>
