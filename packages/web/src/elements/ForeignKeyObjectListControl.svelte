<script>
  import _ from 'lodash';
  import { t } from 'svelte-i18n';
  import ConstraintLabel from '../elements/ConstraintLabel.svelte';

  import ObjectListControl from '../elements/ObjectListControl.svelte';
  import Link from './Link.svelte';

  export let collection;
  export let title;
  export let clickable;
  export let onRemove = null;
  export let onAddNew = null;
  export let emptyMessage = null;
</script>

<ObjectListControl
  {collection}
  {title}
  {onAddNew}
  {clickable}
  {emptyMessage}
  on:clickrow
  columns={[
    {
      fieldName: 'baseColumns',
      header: $t('tab.tableStructure.columns.baseColumns'),
      slot: 0,
    },
    {
      fieldName: 'refTableName',
      header: $t('tab.tableStructure.columns.referencedTable'),
    },
    {
      fieldName: 'refColumns',
      header: $t('tab.tableStructure.columns.referencedColumns'),
      slot: 1,
    },
    {
      fieldName: 'updateAction',
      header: $t('tab.tableStructure.columns.onUpdate'),
    },
    {
      fieldName: 'deleteAction',
      header: $t('tab.tableStructure.columns.onDelete'),
    },
    onRemove
      ? {
          fieldName: 'actions',
          sortable: true,
          slot: 2,
        }
      : null,
  ]}
>
  <svelte:fragment slot="name" let:row><ConstraintLabel {...row} /></svelte:fragment>
  <svelte:fragment slot="0" let:row>{row?.columns.map(x => x.columnName).join(', ')}</svelte:fragment>
  <svelte:fragment slot="1" let:row>{row?.columns.map(x => x.refColumnName).join(', ')}</svelte:fragment>
  <svelte:fragment slot="2" let:row><Link onClick={() => onRemove(row)}>{$t('common.remove')}</Link></svelte:fragment>
</ObjectListControl>
