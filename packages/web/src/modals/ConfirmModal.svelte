<script lang="ts">
  import { _ } from 'svelte-i18n';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';

  export let message;
  export let onConfirm;
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    {message}

    <svelte:fragment slot="footer">
      <FormSubmit
        value={$_('common.ok')}
        on:click={() => {
          closeCurrentModal();
          onConfirm();
        }}
      />
      <FormStyledButton type="button" value={$_('common.close')} on:click={closeCurrentModal} />
    </svelte:fragment>
  </ModalBase>
</FormProvider>
