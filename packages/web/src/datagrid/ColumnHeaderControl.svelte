<script>
  import FontIcon from '../icons/FontIcon.svelte';
  import DropDownButton from '../buttons/DropDownButton.svelte';
  import splitterDrag from '../utility/splitterDrag';
  import _ from 'lodash';

  import ColumnLabel from '../elements/ColumnLabel.svelte';
  import { isTypeDateTime } from 'dbgate-tools';
  import { openDatabaseObjectDetail } from '../appobj/DatabaseObjectAppObject.svelte';
  import { copyTextToClipboard } from '../utility/clipboard';
  import VirtualForeignKeyEditorModal from '../tableeditor/VirtualForeignKeyEditorModal.svelte';
  import { showModal } from '../modals/modalTools';

  export let column;
  export let conid = undefined;
  export let database = undefined;
  export let setSort = undefined;
  export let addToSort = undefined;
  export let clearSort = undefined;
  export let grouping = undefined;
  export let order = undefined;
  export let orderIndex = undefined;
  export let isSortDefined = false;
  export let allowDefineVirtualReferences = false;
  export let setGrouping;

  const openReferencedTable = () => {
    openDatabaseObjectDetail('TableDataTab', null, {
      schemaName: column.foreignKey.refSchemaName,
      pureName: column.foreignKey.refTableName,
      conid,
      database,
      objectTypeField: 'tables',
    });
  };

  const handleDefineVirtualForeignKey = () => {
    showModal(VirtualForeignKeyEditorModal, {
      schemaName: column.schemaName,
      pureName: column.pureName,
      conid,
      database,
      columnName: column.columnName,
    });
  };

  function getMenu() {
    return [
      setSort && { onClick: () => setSort('ASC'), text: 'Sort ascending', id: 'columnHeader.asc' },
      setSort && { onClick: () => setSort('DESC'), text: 'Sort descending', id: 'columnHeader.desc' },
      isSortDefined &&
        addToSort &&
        !order && { onClick: () => addToSort('ASC'), text: 'Add to sort - ascending', id: 'columnHeader.addAscending' },
      isSortDefined &&
        addToSort &&
        !order && {
          onClick: () => addToSort('DESC'),
          text: 'Add to sort - descending',
          id: 'columnHeader.addDescending',
        },
      order && clearSort && { onClick: () => clearSort(), text: 'Clear sort criteria', id: 'columnHeader.clear' },
      { onClick: () => copyTextToClipboard(column.columnName), text: 'Copy column name', id: 'columnHeader.copy' },

      column.foreignKey && [{ divider: true }, { onClick: openReferencedTable, text: column.foreignKey.refTableName }],

      setGrouping && { divider: true },
      setGrouping && { onClick: () => setGrouping('GROUP'), text: 'Group by', id: 'columnHeader.group' },
      setGrouping && { onClick: () => setGrouping('MAX'), text: 'MAX', id: 'columnHeader.max' },
      setGrouping && { onClick: () => setGrouping('MIN'), text: 'MIN', id: 'columnHeader.min' },
      setGrouping && { onClick: () => setGrouping('SUM'), text: 'SUM', id: 'columnHeader.sum' },
      setGrouping && { onClick: () => setGrouping('AVG'), text: 'AVG', id: 'columnHeader.avg' },
      setGrouping && { onClick: () => setGrouping('COUNT'), text: 'COUNT', id: 'columnHeader.count' },
      setGrouping && {
        onClick: () => setGrouping('COUNT DISTINCT'),
        text: 'COUNT DISTINCT',
        id: 'columnHeader.countDistinct',
      },

      isTypeDateTime(column.dataType) && [
        { divider: true },
        { onClick: () => setGrouping('GROUP:YEAR'), text: 'Group by YEAR', id: 'columnHeader.groupYear' },
        { onClick: () => setGrouping('GROUP:MONTH'), text: 'Group by MONTH', id: 'columnHeader.groupMonth' },
        { onClick: () => setGrouping('GROUP:DAY'), text: 'Group by DAY', id: 'columnHeader.groupDay' },
      ],

      // allowDefineVirtualReferences && [
      //   { divider: true },
      //   { onClick: handleDefineVirtualForeignKey, text: 'Define virtual foreign key', id: 'columnHeader.define' },
      // ],
    ];
  }
</script>

<div class="header">
  <div class="label">
    {#if grouping}
      <span class="grouping">
        {grouping == 'COUNT DISTINCT' ? 'distinct' : grouping.toLowerCase()}
      </span>
    {/if}
    <ColumnLabel {...column} />

    {#if _.isString(column.dataType) && !order}
      <span class="data-type" title={column.dataType}>
        {column.dataType.toLowerCase()}
      </span>
    {/if}
  </div>
  {#if order == 'ASC'}
    <span class="icon">
      <FontIcon icon="img sort-asc" />
      {#if orderIndex >= 0}
        <span class="color-icon-green order-index">{orderIndex + 1}</span>
      {/if}
    </span>
  {/if}
  {#if order == 'DESC'}
    <span class="icon">
      <FontIcon icon="img sort-desc" />
      {#if orderIndex >= 0}
        <span class="color-icon-green order-index">{orderIndex + 1}</span>
      {/if}
    </span>
  {/if}
  <DropDownButton menu={getMenu} narrow />
  <div class="horizontal-split-handle resizeHandleControl" use:splitterDrag={'clientX'} on:resizeSplitter />
</div>

<style>
  .header {
    display: flex;
    flex-wrap: nowrap;
  }
  .order-index {
    font-size: 10pt;
    margin-left: -3px;
    margin-right: 2px;
    top: -1px;
    position: relative;
  }
  .label {
    flex: 1;
    min-width: 10px;
    padding: 2px;
    margin: auto;
    white-space: nowrap;
  }
  .icon {
    margin-left: 3px;
    align-self: center;
    font-size: 18px;
  }
  /* .resizer {
    background-color: var(--theme-border);
    width: 2px;
    cursor: col-resize;
    z-index: 1;
  } */
  .grouping {
    color: var(--theme-font-alt);
    white-space: nowrap;
  }
  .data-type {
    color: var(--theme-font-3);
  }
</style>
