<script lang="ts">
  import { t } from 'svelte-i18n';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';

  import FormTextField from '../forms/FormTextField.svelte';
  import FormCheckboxField from '../forms/FormCheckboxField.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FormButton from '../forms/FormButton.svelte';
  import ModalBase from '../modals/ModalBase.svelte';
  import { closeCurrentModal } from '../modals/modalTools';
  import DataTypeEditor from './DataTypeEditor.svelte';
  import { editorAddColumn, editorDeleteColumn, editorModifyColumn, fillEditorColumnInfo } from 'dbgate-tools';

  export let columnInfo;
  export let setTableInfo = null;
  export let tableInfo = null;
  export let onAddNext;
  export let driver = null;

  export let addDataCommand = false;
</script>

<FormProvider initialValues={fillEditorColumnInfo(columnInfo || {}, tableInfo)}>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header"
      >{columnInfo
        ? $t('tab.tableStructure.modal.editColumn')
        : `${$t('tab.tableStructure.modal.addColumn')} ${(tableInfo?.columns || []).length + 1}`}</svelte:fragment
    >

    <FormTextField name="columnName" label={$t('tab.tableStructure.columns.name')} focused />
    <DataTypeEditor dialect={driver?.dialect} />

    <FormCheckboxField name="notNull" label={$t('tab.tableStructure.columns.notNull')} />
    <FormCheckboxField name="isPrimaryKey" label={$t('tab.tableStructure.columns.isPrimaryKey')} />
    <FormCheckboxField name="autoIncrement" label={$t('tab.tableStructure.columns.isAutoincrement')} />
    <FormTextField name="defaultValue" label={$t('tab.tableStructure.columns.defaultValueDetail')} />
    <FormTextField name="computedExpression" label={$t('tab.tableStructure.columns.computedExpression')} />
    {#if driver?.dialect?.columnProperties?.isUnsigned}
      <FormCheckboxField name="isUnsigned" label={$t('tab.tableStructure.columns.unsigned')} />
    {/if}
    {#if driver?.dialect?.columnProperties?.isZerofill}
      <FormCheckboxField name="isZerofill" label={$t('tab.tableStructure.columns.zeroFill')} />
    {/if}
    {#if driver?.dialect?.columnProperties?.columnComment}
      <FormTextField name="columnComment" label={$t('tab.tableStructure.columns.comment')} />
    {/if}
    {#if driver?.dialect?.columnProperties?.isSparse}
      <FormCheckboxField name="isSparse" label={$t('tab.tableStructure.columns.isSparse')} />
    {/if}

    <svelte:fragment slot="footer">
      <FormSubmit
        value={columnInfo ? $t('common.save') : $t('common.saveAndNext')}
        on:click={e => {
          closeCurrentModal();
          if (columnInfo) {
            setTableInfo(tbl => editorModifyColumn(tbl, e.detail, addDataCommand));
          } else {
            setTableInfo(tbl => editorAddColumn(tbl, e.detail, addDataCommand));
            if (onAddNext) onAddNext();
          }
        }}
      />
      {#if !columnInfo}
        <FormButton
          type="button"
          value={$t('common.save')}
          on:click={e => {
            closeCurrentModal();
            setTableInfo(tbl => editorAddColumn(tbl, e.detail, addDataCommand));
          }}
        />
      {/if}

      <FormStyledButton type="button" value={$t('common.close')} on:click={closeCurrentModal} />
      {#if columnInfo}
        <FormStyledButton
          type="button"
          value={$t('common.close')}
          on:click={() => {
            closeCurrentModal();
            setTableInfo(tbl => editorDeleteColumn(tbl, columnInfo, addDataCommand));
          }}
        />
      {/if}
    </svelte:fragment>
  </ModalBase>
</FormProvider>
