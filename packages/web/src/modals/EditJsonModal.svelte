<script>
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import FormProvider from '../forms/FormProvider.svelte';
  // import FormSubmit from '../forms/FormSubmit.svelte';
  import AceEditor from '../query/AceEditor.svelte';
  import ErrorMessageModal from './ErrorMessageModal.svelte';

  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal, showModal } from './modalTools';

  export let onSave;
  export let json;
  export let showPasteInfo;

  let value;
  let editor;

  onMount(() => {
    if (json) {
      value = JSON.stringify(json, undefined, 2);
    } else {
      // editor.getEditor().execCommand('paste');
    }
    editor.getEditor().focus();
  });
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <div slot="header">{$t('modal.editJson.header')}</div>
    {#if showPasteInfo}
      <div class="m-2">
        {$t('modal.editJson.tip')}
      </div>
    {/if}

    <div class="editor">
      <AceEditor mode="json" bind:value bind:this={editor} />
    </div>

    <div slot="footer">
      <FormStyledButton
        value={$t('common.save')}
        on:click={() => {
          try {
            const parsed = JSON.parse(value);
            if (onSave(parsed)) {
              closeCurrentModal();
            }
          } catch (err) {
            showModal(ErrorMessageModal, { message: err.message });
            return;
          }
        }}
      />
      <FormStyledButton type="button" value={$t('common.close')} on:click={closeCurrentModal} />
    </div>
  </ModalBase>
</FormProvider>

<style>
  .editor {
    position: relative;
    height: 30vh;
    width: 40vw;
    margin-top: 8px;
  }
</style>
