<script lang="ts">
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import uuidv1 from 'uuid/v1';
  import { t } from 'svelte-i18n';
  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import ModalBase from '../modals/ModalBase.svelte';
  import { closeCurrentModal } from '../modals/modalTools';
  import { editorAddConstraint, editorDeleteConstraint, editorModifyConstraint } from 'dbgate-tools';
  import TextField from '../forms/TextField.svelte';
  import SelectField from '../forms/SelectField.svelte';

  export let constraintInfo;
  export let setTableInfo;
  export let tableInfo;
  export let constraintLabel;
  export let constraintType;
  export let constraintNameLabel = $t('tab.tableStructure.modal.constraints.name');
  export let getExtractConstraintProps;

  let constraintName = constraintInfo?.constraintName;
  let columns = constraintInfo?.columns || [];

  function getConstraint() {
    return {
      pairingId: uuidv1(),
      ...constraintInfo,
      columns,
      pureName: tableInfo.pureName,
      schemaName: tableInfo.schemaName,
      constraintName,
      constraintType,
      ...(getExtractConstraintProps ? getExtractConstraintProps() : {}),
    };
  }
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header"
      >{constraintInfo
        ? `${$t('tab.tableStructure.modal.edit')} ${constraintLabel}`
        : `${$t('tab.tableStructure.modal.add')} ${constraintLabel}`}</svelte:fragment
    >

    <div class="largeFormMarker">
      <div class="row">
        <div class="label col-3">{constraintNameLabel}</div>
        <div class="col-9">
          <TextField value={constraintName} on:input={e => (constraintName = e.target['value'])} focused />
        </div>
      </div>

      {#if $$slots.constraintProps}
        <slot name="constraintProps" />
      {/if}

      {#each columns as column, index}
        <div class="row">
          <div class="label col-3">{$t('tab.tableStructure.modal.constraints.column')} {index + 1}</div>
          <div class={$$slots.column ? 'col-3' : 'col-6'}>
            {#key column.columnName}
              <SelectField
                value={column.columnName}
                isNative
                options={tableInfo.columns.map(col => ({
                  label: col.columnName,
                  value: col.columnName,
                }))}
                on:change={e => {
                  if (e.detail) {
                    columns = columns.map((col, i) => (i == index ? { columnName: e.detail } : col));
                  }
                }}
              />
            {/key}
          </div>
          {#if $$slots.column}
            <div class="col-3">
              <slot name="column" {column} setColumns={changeFunc => (columns = changeFunc(columns))} {index} />
            </div>
          {/if}
          <div class="col-3 button">
            <FormStyledButton
              value={$t('common.delete')}
              on:click={e => {
                const x = [...columns];
                x.splice(index, 1);
                columns = x;
              }}
            />
          </div>
        </div>
      {/each}

      <div class="row">
        <div class="label col-3">{$t('tab.tableStructure.modal.constraints.addNew')}</div>
        <div class="col-9">
          {#key columns.length}
            <SelectField
              placeholder={$t('tab.tableStructure.modal.constraints.select')}
              value={''}
              on:change={e => {
                if (e.detail)
                  columns = [
                    ...columns,
                    {
                      columnName: e.detail,
                    },
                  ];
              }}
              isNative
              options={[
                {
                  label: $t('tab.tableStructure.modal.constraints.choose'),
                  value: '',
                },
                ...(tableInfo?.columns?.map(col => ({
                  label: col.columnName,
                  value: col.columnName,
                })) || []),
              ]}
            />
          {/key}
        </div>
      </div>
    </div>

    <svelte:fragment slot="footer">
      <FormSubmit
        value={$t('common.save')}
        on:click={() => {
          closeCurrentModal();
          if (constraintInfo) {
            setTableInfo(tbl => editorModifyConstraint(tbl, getConstraint()));
          } else {
            setTableInfo(tbl => editorAddConstraint(tbl, getConstraint()));
          }
        }}
      />

      <FormStyledButton type="button" value={$t('common.close')} on:click={closeCurrentModal} />
      {#if constraintInfo}
        <FormStyledButton
          type="button"
          value={$t('common.remove')}
          on:click={() => {
            closeCurrentModal();
            setTableInfo(tbl => editorDeleteConstraint(tbl, constraintInfo));
          }}
        />
      {/if}
    </svelte:fragment>
  </ModalBase>
</FormProvider>

<style>
  .row {
    margin: var(--dim-large-form-margin);
    display: flex;
  }

  .row .label {
    white-space: nowrap;
    align-self: center;
  }

  .button {
    align-self: center;
    text-align: right;
  }
</style>
