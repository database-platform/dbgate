<script lang="ts">
  import { t } from 'svelte-i18n';
  import TextAreaField from '../forms/TextAreaField.svelte';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';

  export let onFilter;

  let value;
  let group = 'is';

  const handleOk = () => {
    onFilter(group, value);
    closeCurrentModal();
  };
</script>

<ModalBase {...$$restProps}>
  <div slot="header">{$t('modal.filterMultipleValues.header')}</div>

  <div class="flex">
    <TextAreaField rows={10} bind:value focused />
    <div>
      <div>
        <input type="radio" bind:group value="is" id="__is" />
        <label for="__is">{$t('command.filter.isOneOfLine')}</label>'
      </div>
      <div>
        <input type="radio" bind:group value="is_not" id="__is_not" />
        <label for="__is_not">{$t('command.filter.isNotOneOfLine')}</label>'
      </div>
      <div>
        <input type="radio" bind:group value="contains" id="__contains" />
        <label for="__contains">{$t('command.filter.contains')}</label>'
      </div>
      <div>
        <input type="radio" bind:group value="begins" id="__begins" />
        <label for="__begins">{$t('command.filter.beginsWith')}</label>'
      </div>
      <div>
        <input type="radio" bind:group value="ends" id="__ends" />
        <label for="__ends">{$t('command.filter.endsWith')}</label>'
      </div>
    </div>
  </div>
  <div slot="footer">
    <FormStyledButton value={$t('common.ok')} on:click={handleOk} />
    <FormStyledButton type="button" value={$t('common.close')} on:click={closeCurrentModal} />
  </div>
</ModalBase>
