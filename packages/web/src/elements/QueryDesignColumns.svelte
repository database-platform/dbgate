<script context="module">
  function getTableDisplayName(column, tables) {
    const table = (tables || []).find(x => x.designerId == column.designerId);
    if (table) return table.alias || table.pureName;
    return '';
  }
</script>

<script>
  import DataFilterControl from '../datagrid/DataFilterControl.svelte';
  import { findDesignerFilterType } from '../designer/designerTools';
  import CheckboxField from '../forms/CheckboxField.svelte';
  import SelectField from '../forms/SelectField.svelte';
  import TextField from '../forms/TextField.svelte';
  import InlineButton from '../buttons/InlineButton.svelte';
  import uuidv1 from 'uuid/v1';

  import TableControl from './TableControl.svelte';
  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import _ from 'lodash';
  import { t } from 'svelte-i18n';
  import FontIcon from '../icons/FontIcon.svelte';

  export let value;
  export let onChange;

  const changeColumn = col => {
    onChange(current => ({
      ...current,
      columns: (current.columns || []).map(x =>
        x.designerId == col.designerId && x.columnName == col.columnName ? col : x
      ),
    }));
  };

  const removeColumn = col => {
    onChange(current => ({
      ...current,
      columns: (current.columns || []).filter(x => x.designerId != col.designerId || x.columnName != col.columnName),
    }));
  };

  const moveColumn = (col, d) => {
    onChange(current => {
      const index = _.findIndex(
        current.columns || [],
        x => col.designerId == x.designerId && col.columnName == x.columnName
      );

      if (index >= 0 && index + d >= 0 && index + d < current.columns?.length) {
        let columns = [...current.columns];

        let tmp = columns[index + d];
        columns[index + d] = columns[index];
        columns[index] = tmp;

        return {
          ...current,
          columns: newColumns,
        };
      }

      return current;
    });
  };

  const addExpressionColumn = () => {
    onChange(current => ({
      ...current,
      columns: [...(current.columns || []), { isCustomExpression: true, isOutput: true, designerId: uuidv1() }],
    }));
  };

  const addOrCondition = () => {
    onChange(current => ({
      ...current,
      settings: {
        ...current?.settings,
        additionalFilterCount: (current?.settings?.additionalFilterCount ?? 0) + 1,
      },
    }));
  };

  const removeOrCondition = () => {
    onChange(current => ({
      ...current,
      settings: {
        ...current?.settings,
        additionalFilterCount: (current?.settings?.additionalFilterCount ?? 1) - 1,
      },
    }));
  };

  const addGroupOrCondition = () => {
    onChange(current => ({
      ...current,
      settings: {
        ...current?.settings,
        additionalGroupFilterCount: (current?.settings?.additionalGroupFilterCount ?? 0) + 1,
      },
    }));
  };

  const removeGroupOrCondition = () => {
    onChange(current => ({
      ...current,
      settings: {
        ...current?.settings,
        additionalGroupFilterCount: (current?.settings?.additionalGroupFilterCount ?? 1) - 1,
      },
    }));
  };

  $: columns = value?.columns;
  $: tables = value?.tables;
  $: settings = value?.settings;
  $: hasGroupedColumn = !!(columns || []).find(x => x.isGrouped);
</script>

<div class="wrapper">
  <TableControl
    rows={columns || []}
    columns={[
      { fieldName: 'columnName', slot: 8, header: $t('tab.design.columns.columnName') },
      {
        fieldName: 'tableDisplayName',
        header: $t('tab.design.columns.table'),
        formatter: row => getTableDisplayName(row, tables),
      },
      { fieldName: 'isOutput', header: $t('tab.design.columns.output'), slot: 0 },
      { fieldName: 'alias', header: $t('tab.design.columns.alias'), slot: 1 },
      { fieldName: 'isGrouped', header: $t('tab.design.columns.groupBy'), slot: 2 },
      { fieldName: 'aggregate', header: $t('tab.design.columns.aggregate'), slot: 3 },
      { fieldName: 'sortOrder', header: $t('tab.design.columns.sortOrder'), slot: 4 },
      { fieldName: 'filter', header: $t('tab.design.columns.filter'), slot: 5, props: { filterField: 'filter' } },
      ..._.range(settings?.additionalFilterCount || 0).map(index => ({
        fieldName: `additionalFilter${index + 1}`,
        header: `${$t('tab.design.columns.orFilter')} ${index + 2}`,
        slot: 5,
        props: { filterField: `additionalFilter${index + 1}` },
      })),
      hasGroupedColumn && {
        fieldName: 'groupFilter',
        header: $t('tab.design.columns.groupFilter'),
        slot: 5,
        props: { filterField: 'groupFilter' },
      },
      ..._.range(hasGroupedColumn ? settings?.additionalGroupFilterCount || 0 : 0).map(index => ({
        fieldName: `additionalGroupFilter${index + 1}`,
        header: `${$t('tab.design.columns.orGroupFilter')} ${index + 2}`,
        slot: 5,
        props: { filterField: `additionalGroupFilter${index + 1}` },
      })),
      { fieldName: 'actions', header: '', slot: 7 },
    ]}
  >
    <svelte:fragment slot="8" let:row>
      {#if row.isCustomExpression}
        <TextField
          style="min-width:calc(100% - 9px)"
          value={row.customExpression}
          on:input={e => {
            changeColumn({ ...row, customExpression: e.target.value });
          }}
        />
      {:else}
        {row.columnName}
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="0" let:row>
      <CheckboxField
        checked={row.isOutput}
        on:change={e => {
          if (e.target.checked) changeColumn({ ...row, isOutput: true });
          else changeColumn({ ...row, isOutput: false });
        }}
      />
    </svelte:fragment>
    <svelte:fragment slot="1" let:row>
      <TextField
        style="min-width:calc(100% - 9px)"
        value={row.alias}
        on:input={e => {
          changeColumn({ ...row, alias: e.target.value });
        }}
      />
    </svelte:fragment>
    <svelte:fragment slot="2" let:row>
      <CheckboxField
        checked={row.isGrouped}
        on:change={e => {
          if (e.target.checked) changeColumn({ ...row, isGrouped: true });
          else changeColumn({ ...row, isGrouped: false });
        }}
      />
    </svelte:fragment>
    <svelte:fragment slot="3" let:row>
      {#if !row.isGrouped}
        <SelectField
          isNative
          style="min-width:calc(100% - 9px)"
          value={row.aggregate}
          on:change={e => {
            changeColumn({ ...row, aggregate: e.detail });
          }}
          options={['---', 'MIN', 'MAX', 'COUNT', 'COUNT DISTINCT', 'SUM', 'AVG'].map(x => ({ label: x, value: x }))}
        />
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="4" let:row>
      <SelectField
        isNative
        style="min-width:calc(100% - 9px)"
        value={row.sortOrder?.toString()}
        on:change={e => {
          changeColumn({ ...row, sortOrder: parseInt(e.detail) });
        }}
        options={[
          { label: '---', value: '0' },
          { label: '1st, ascending', value: '1' },
          { label: '1st, descending', value: '-1' },
          { label: '2nd, ascending', value: '2' },
          { label: '2nd, descending', value: '-2' },
          { label: '3rd, ascending', value: '3' },
          { label: '3rd, descending', value: '-3' },
          { label: '4th, ascending', value: '4' },
          { label: '4th, descending', value: '-4' },
          { label: '5th, ascending', value: '5' },
          { label: '5th, descending', value: '-5' },
          { label: '6th, ascending', value: '6' },
          { label: '6th, descending', value: '-6' },
          { label: '7th, ascending', value: '7' },
          { label: '7th, descending', value: '-7' },
          { label: '8th, ascending', value: '8' },
          { label: '8th, descending', value: '-8' },
          { label: '9th, ascending', value: '9' },
          { label: '9th, descending', value: '-9' },
          { label: '10th, ascending', value: '10' },
          { label: '10th, descending', value: '-10' },
        ]}
      />
    </svelte:fragment>
    <svelte:fragment slot="5" let:row let:filterField>
      <DataFilterControl
        filterType={findDesignerFilterType(row, value)}
        filter={row[filterField]}
        setFilter={filter => {
          changeColumn({ ...row, [filterField]: filter });
        }}
      />
    </svelte:fragment>
    <svelte:fragment slot="7" let:row>
      <div class="flex">
        <InlineButton on:click={() => removeColumn(row)} square><FontIcon icon="icon delete" /></InlineButton>
        <InlineButton on:click={() => moveColumn(row, -1)} square><FontIcon icon="icon arrow-up" /></InlineButton>
        <InlineButton on:click={() => moveColumn(row, 1)} square><FontIcon icon="icon arrow-down" /></InlineButton>
      </div>
    </svelte:fragment>
  </TableControl>
  <FormStyledButton
    value={$t('tab.design.btn.addCustomExpression')}
    on:click={addExpressionColumn}
    style="width:200px"
  />
  <FormStyledButton value={$t('tab.design.btn.addOrCondition')} on:click={addOrCondition} style="width:200px" />
  {#if settings?.additionalFilterCount > 0}
    <FormStyledButton value={$t('tab.design.btn.removeOrCondition')} on:click={removeOrCondition} style="width:200px" />
  {/if}
  {#if hasGroupedColumn}
    <FormStyledButton
      value={$t('tab.design.btn.addGroupOrCondition')}
      on:click={addGroupOrCondition}
      style="width:200px"
    />
  {/if}
  {#if hasGroupedColumn && settings?.additionalGroupFilterCount > 0}
    <FormStyledButton
      value={$t('tab.design.btn.removeGroupOrCondition')}
      on:click={removeGroupOrCondition}
      style="width:200px"
    />
  {/if}
</div>

<style>
  .wrapper {
    overflow: auto;
    flex: 1;
  }
</style>
