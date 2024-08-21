<script context="module">
</script>

<script>
  import { createMultiLineFilter, parseFilter } from 'dbgate-filterparser';
  import splitterDrag from '../utility/splitterDrag';

  import FilterMultipleValuesModal from '../modals/FilterMultipleValuesModal.svelte';
  import { getFilterValueExpression } from 'dbgate-filterparser';

  import { showModal } from '../modals/modalTools';
  import SetFilterModal from '../modals/SetFilterModal.svelte';
  import keycodes from '../utility/keycodes';

  import DropDownButton from '../buttons/DropDownButton.svelte';
  import InlineButton from '../buttons/InlineButton.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import DictionaryLookupModal from '../modals/DictionaryLookupModal.svelte';
  import ValueLookupModal from '../modals/ValueLookupModal.svelte';

  export let isReadOnly = false;
  export let filterType;
  export let filter;
  export let setFilter;
  export let showResizeSplitter = false;
  export let onFocusGrid = null;
  export let onGetReference = null;
  export let foreignKey = null;
  export let conid = null;
  export let database = null;
  export let driver = null;
  export let jslid = null;
  export let customCommandIcon = null;
  export let onCustomCommand = null;
  export let customCommandTooltip = null;
  export let formatterFunction = null;

  export let pureName = null;
  export let schemaName = null;
  export let columnName = null;
  export let uniqueName = null;

  export let placeholder = 'Filter';

  let value;
  let isError;
  let isOk;
  let domInput;

  $: if (onGetReference && domInput) onGetReference(domInput);

  function openFilterWindow(condition1) {
    showModal(SetFilterModal, { condition1, filterType, onFilter: setFilter });
  }

  const filterMultipleValues = () => {
    showModal(FilterMultipleValuesModal, {
      onFilter: (mode, text) => setFilter(createMultiLineFilter(mode, text)),
    });
  };

  function createMenu() {
    switch (filterType) {
      case 'number':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clearFilter' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },
          { onClick: () => openFilterWindow('='), text: 'Equals...', id: 'filter.equals' },
          { onClick: () => openFilterWindow('<>'), text: 'Does Not Equal...', id: 'filter.notEquals' },
          { onClick: () => setFilter('NULL'), text: 'Is Null', id: 'filter.isNull' },
          { onClick: () => setFilter('NOT NULL'), text: 'Is Not Null', id: 'filter.isNotNull' },
          { onClick: () => openFilterWindow('>'), text: 'Greater Than...', id: 'filter.greaterThan' },
          {
            onClick: () => openFilterWindow('>='),
            text: 'Greater Than Or Equal To...',
            id: 'filter.greaterThanOrEqual',
          },
          { onClick: () => openFilterWindow('<'), text: 'Less Than...', id: 'filter.lessThan' },
          { onClick: () => openFilterWindow('<='), text: 'Less Than Or Equal To...', id: 'filter.lessThanOrEqual' },

          { divider: true },

          { onClick: () => openFilterWindow('sql'), text: 'SQL condition ...', id: 'filter.sql' },
          {
            onClick: () => openFilterWindow('sqlRight'),
            text: 'SQL condition - right side ...',
            id: 'filter.sqlRight',
          },
        ];
      case 'logical':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clear' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },
          { onClick: () => setFilter('NULL'), text: 'Is Null', id: 'filter.isNull' },
          { onClick: () => setFilter('NOT NULL'), text: 'Is Not Null', id: 'filter.isNotNull' },
          { onClick: () => setFilter('TRUE'), text: 'Is True', id: 'filter.isTrue' },
          { onClick: () => setFilter('FALSE'), text: 'Is False', id: 'filter.isFalse' },
          { onClick: () => setFilter('TRUE, NULL'), text: 'Is True or NULL', id: 'filter.isTrueOrNull' },
          { onClick: () => setFilter('FALSE, NULL'), text: 'Is False or NULL', id: 'filter.isFalseOrNull' },

          { divider: true },

          { onClick: () => openFilterWindow('sql'), text: 'SQL condition ...', id: 'filter.sql' },
          {
            onClick: () => openFilterWindow('sqlRight'),
            text: 'SQL condition - right side ...',
            id: 'filter.sqlRight',
          },
        ];
      case 'datetime':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clear' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },
          { onClick: () => setFilter('NULL'), text: 'Is Null', id: 'filter.isNull' },
          { onClick: () => setFilter('NOT NULL'), text: 'Is Not Null', id: 'filter.isNotNull' },

          { divider: true },

          { onClick: () => openFilterWindow('<='), text: 'Before...', id: 'filter.before' },
          { onClick: () => openFilterWindow('>='), text: 'After...', id: 'filter.after' },
          { onClick: () => openFilterWindow('>=;<='), text: 'Between...', id: 'filter.between' },

          { divider: true },

          { onClick: () => setFilter('TOMORROW'), text: 'Tomorrow', id: 'filter.tomorrow' },
          { onClick: () => setFilter('TODAY'), text: 'Today', id: 'filter.today' },
          { onClick: () => setFilter('YESTERDAY'), text: 'Yesterday', id: 'filter.yesterday' },

          { divider: true },

          { onClick: () => setFilter('NEXT WEEK'), text: 'Next Week', id: 'filter.nextWeek' },
          { onClick: () => setFilter('THIS WEEK'), text: 'This Week', id: 'filter.thisWeek' },
          { onClick: () => setFilter('LAST WEEK'), text: 'Last Week', id: 'filter.lastWeek' },

          { divider: true },

          { onClick: () => setFilter('NEXT MONTH'), text: 'Next Month', id: 'filter.nextMonth' },
          { onClick: () => setFilter('THIS MONTH'), text: 'This Month', id: 'filter.thisMonth' },
          { onClick: () => setFilter('LAST MONTH'), text: 'Last Month', id: 'filter.lastMonth' },

          { divider: true },

          { onClick: () => setFilter('NEXT YEAR'), text: 'Next Year', id: 'filter.nextYear' },
          { onClick: () => setFilter('THIS YEAR'), text: 'This Year', id: 'filter.thisYear' },
          { onClick: () => setFilter('LAST YEAR'), text: 'Last Year', id: 'filter.lastYear' },

          { divider: true },

          { onClick: () => openFilterWindow('sql'), text: 'SQL condition ...', id: 'filter.sql' },
          {
            onClick: () => openFilterWindow('sqlRight'),
            text: 'SQL condition - right side ...',
            id: 'filter.sqlRight',
          },
        ];
      case 'string':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clearFilter', id: 'filter.clear' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },

          { onClick: () => openFilterWindow('='), text: 'Equals...', id: 'filter.equals' },
          { onClick: () => openFilterWindow('<>'), text: 'Does Not Equal...', id: 'filter.notEquals' },
          { onClick: () => setFilter('NULL'), text: 'Is Null', id: 'filter.isNull' },
          { onClick: () => setFilter('NOT NULL'), text: 'Is Not Null', id: 'filter.isNotNull' },
          { onClick: () => setFilter('EMPTY, NULL'), text: 'Is Empty Or Null', id: 'filter.isEmptyOrNull' },
          { onClick: () => setFilter('NOT EMPTY NOT NULL'), text: 'Has Not Empty Value', id: 'filter.notEmptyNotNull' },

          { divider: true },

          { onClick: () => openFilterWindow('+'), text: 'Contains...', id: 'filter.contains' },
          { onClick: () => openFilterWindow('~'), text: 'Does Not Contain...', id: 'filter.notContain' },
          { onClick: () => openFilterWindow('^'), text: 'Begins With...', id: 'filter.beginsWith' },
          { onClick: () => openFilterWindow('!^'), text: 'Does Not Begin With...', id: 'filter.notBeginWith' },
          { onClick: () => openFilterWindow('$'), text: 'Ends With...', id: 'filter.endsWith' },
          { onClick: () => openFilterWindow('!$'), text: 'Does Not End With...', id: 'filter.notEndWith' },

          { divider: true },

          { onClick: () => openFilterWindow('sql'), text: 'SQL condition ...', id: 'filter.sql' },
          {
            onClick: () => openFilterWindow('sqlRight'),
            text: 'SQL condition - right side ...',
            id: 'filter.sqlRight',
          },
        ];
      case 'mongo':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clear' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },
          { onClick: () => openFilterWindow('='), text: 'Equals...', id: 'filter.equals' },
          { onClick: () => openFilterWindow('<>'), text: 'Does Not Equal...', id: 'filter.notEquals' },
          { onClick: () => setFilter('EXISTS'), text: 'Field exists', id: 'filter.fieldExists' },
          { onClick: () => setFilter('NOT EXISTS'), text: 'Field does not exist', id: 'filter.notExists' },
          { onClick: () => setFilter('NOT EMPTY ARRAY'), text: 'Array is not empty', id: 'filter.notEmptyArray' },
          { onClick: () => setFilter('EMPTY ARRAY'), text: 'Array is empty', id: 'filter.emptyArray' },
          { onClick: () => openFilterWindow('>'), text: 'Greater Than...', id: 'filter.greaterThan' },
          {
            onClick: () => openFilterWindow('>='),
            text: 'Greater Than Or Equal To...',
            id: 'filter.greaterThanOrEqual',
          },
          { onClick: () => openFilterWindow('<'), text: 'Less Than...', id: 'filter.lessThan' },
          { onClick: () => openFilterWindow('<='), text: 'Less Than Or Equal To...', id: 'filter.lessThanOrEqual' },
          { divider: true },
          { onClick: () => openFilterWindow('+'), text: 'Contains...', id: 'filter.contains' },
          { onClick: () => openFilterWindow('~'), text: 'Does Not Contain...', id: 'filter.notContain' },
          { onClick: () => openFilterWindow('^'), text: 'Begins With...', id: 'filter.beginsWith' },
          { onClick: () => openFilterWindow('!^'), text: 'Does Not Begin With...', id: 'filter.notBeginWith' },
          { onClick: () => openFilterWindow('$'), text: 'Ends With...', id: 'filter.endsWith' },
          { onClick: () => openFilterWindow('!$'), text: 'Does Not End With...', id: 'filter.notEndWith' },
          { divider: true },
          { onClick: () => setFilter('TRUE'), text: 'Is True', id: 'filter.isTrue' },
          { onClick: () => setFilter('FALSE'), text: 'Is False', id: 'filter.isFalse' },
        ];
      case 'eval':
        return [
          { onClick: () => setFilter(''), text: 'Clear Filter', id: 'filter.clear' },
          { onClick: () => filterMultipleValues(), text: 'Filter multiple values', id: 'filter.multipleValues' },

          { onClick: () => openFilterWindow('='), text: 'Equals...', id: 'filter.equals' },
          { onClick: () => openFilterWindow('<>'), text: 'Does Not Equal...', id: 'filter.notEquals' },
          { onClick: () => setFilter('NULL'), text: 'Is Null', id: 'filter.isNull' },
          { onClick: () => setFilter('NOT NULL'), text: 'Is Not Null', id: 'filter.isNotNull' },

          { divider: true },

          { onClick: () => openFilterWindow('>'), text: 'Greater Than...', id: 'filter.greaterThan' },
          {
            onClick: () => openFilterWindow('>='),
            text: 'Greater Than Or Equal To...',
            id: 'filter.greaterThanOrEqual',
          },
          { onClick: () => openFilterWindow('<'), text: 'Less Than...', id: 'filter.lessThan' },
          { onClick: () => openFilterWindow('<='), text: 'Less Than Or Equal To...', id: 'filter.lessThanOrEqual' },

          { divider: true },

          { onClick: () => openFilterWindow('+'), text: 'Contains...', id: 'filter.contains' },
          { onClick: () => openFilterWindow('~'), text: 'Does Not Contain...', id: 'filter.notContain' },
          { onClick: () => openFilterWindow('^'), text: 'Begins With...', id: 'filter.beginsWith' },
          { onClick: () => openFilterWindow('!^'), text: 'Does Not Begin With...', id: 'filter.notBeginWith' },
          { onClick: () => openFilterWindow('$'), text: 'Ends With...', id: 'filter.endsWith' },
          { onClick: () => openFilterWindow('!$'), text: 'Does Not End With...', id: 'filter.notEndWith' },
        ];
    }

    // return [
    //   { text: 'Clear filter', onClick: () => (value = '') },
    //   { text: 'Is Null', onClick: () => (value = 'NULL') },
    //   { text: 'Is Not Null', onClick: () => (value = 'NOT NULL') },
    // ];
  }

  const handleKeyDown = ev => {
    if (isReadOnly) return;
    if (ev.keyCode == keycodes.enter) {
      applyFilter();
    }
    if (ev.keyCode == keycodes.escape) {
      setFilter('');
    }
    if (ev.keyCode == keycodes.downArrow) {
      if (onFocusGrid) onFocusGrid();
      // ev.stopPropagation();
      ev.preventDefault();
    }
    // if (ev.keyCode == KeyCodes.DownArrow || ev.keyCode == KeyCodes.UpArrow) {
    //     if (this.props.onControlKey) this.props.onControlKey(ev.keyCode);
    // }
  };

  function handlePaste(event) {
    var pastedText = undefined;
    // @ts-ignore
    if (window.clipboardData && window.clipboardData.getData) {
      // IE
      // @ts-ignore
      pastedText = window.clipboardData.getData('Text');
    } else if (event.clipboardData && event.clipboardData.getData) {
      pastedText = event.clipboardData.getData('text/plain');
    }
    if (pastedText && pastedText.includes('\n')) {
      event.preventDefault();
      setFilter(createMultiLineFilter('is', pastedText));
    }
  }

  function handleShowDictionary() {
    showModal(DictionaryLookupModal, {
      conid,
      database,
      driver,
      pureName: foreignKey.refTableName,
      schemaName: foreignKey.refSchemaName,
      multiselect: true,
      onConfirm: keys => setFilter(keys.join(',')),
    });
  }

  function handleShowValuesModal() {
    showModal(ValueLookupModal, {
      conid,
      database,
      driver,
      jslid,
      multiselect: true,
      schemaName,
      pureName,
      field: columnName || uniqueName,
      formatterFunction,
      onConfirm: keys => setFilter(keys.map(x => getFilterValueExpression(x)).join(',')),
    });
  }

  $: value = filter;

  $: {
    try {
      isOk = false;
      isError = false;
      if (value) {
        parseFilter(value, filterType);
        isOk = true;
      }
    } catch (err) {
      // console.error(err);
      isError = true;
    }
  }

  function applyFilter() {
    if ((filter || '') == (value || '')) return;
    setFilter(value);
  }

  // $: if (value != filter) setFilter(value);
</script>

<div class="flex">
  <input
    bind:this={domInput}
    type="text"
    autocomplete="off"
    readOnly={isReadOnly}
    bind:value
    on:keydown={handleKeyDown}
    on:blur={applyFilter}
    on:paste={handlePaste}
    class:isError
    class:isOk
    {placeholder}
  />
  {#if customCommandIcon && onCustomCommand}
    <InlineButton on:click={onCustomCommand} title={customCommandTooltip} narrow square>
      <FontIcon icon={customCommandIcon} />
    </InlineButton>
  {/if}
  {#if conid && database && driver}
    {#if driver?.databaseEngineTypes?.includes('sql') && foreignKey}
      <InlineButton on:click={handleShowDictionary} narrow square>
        <FontIcon icon="icon dots-horizontal" />
      </InlineButton>
    {:else if (pureName && columnName) || (pureName && uniqueName && driver?.databaseEngineTypes?.includes('document'))}
      <InlineButton on:click={handleShowValuesModal} narrow square>
        <FontIcon icon="icon dots-vertical" />
      </InlineButton>
    {/if}
  {:else if jslid}
    <InlineButton on:click={handleShowValuesModal} narrow square>
      <FontIcon icon="icon dots-vertical" />
    </InlineButton>
  {/if}
  <DropDownButton icon="icon filter" menu={createMenu} narrow />
  {#if showResizeSplitter}
    <div class="horizontal-split-handle resizeHandleControl" use:splitterDrag={'clientX'} on:resizeSplitter />
  {/if}
</div>

<style>
  input {
    flex: 1;
    min-width: 10px;
    width: 1px;
  }

  input.isError {
    background-color: var(--theme-bg-red);
  }

  input.isOk {
    background-color: var(--theme-bg-green);
  }
</style>
