<script lang="ts">
  import { t } from 'svelte-i18n';
  import FormSelectFieldRaw from '../forms/FormSelectFieldRaw.svelte';

  export let name;
  export let filterType;

  function getOptions() {
    let result = [];
    switch (filterType) {
      case 'number':
        result = [
          { value: '=', label: 'equals', id: 'equals' },
          { value: '<>', label: 'does not equal', id: 'notEquals' },
          { value: '<', label: 'is smaller', id: 'lessThan' },
          { value: '>', label: 'is greater', id: 'greaterThan' },
          { value: '<=', label: 'is smaller or equal', id: 'lessThanOrEqual' },
          { value: '>=', label: 'is greater or equal', id: 'greaterThanOrEqual' },
          { value: 'NULL', label: 'is NULL', id: 'isNull' },
          { value: 'NOT NULL', label: 'is not NULL', id: 'isNotNull' },
          { value: 'sql', label: 'SQL condition', id: 'sql' },
          { value: 'sqlRight', label: 'SQL condition - right side only', id: 'sqlRight' },
        ];
        break;
      case 'string':
        result = [
          { value: '+', label: 'contains', id: 'contains' },
          { value: '~', label: 'does not contain', id: 'notContain' },
          { value: '^', label: 'begins with', id: 'beginsWith' },
          { value: '!^', label: 'does not begin with', id: 'notBeginWith' },
          { value: '$', label: 'ends with', id: 'endsWith' },
          { value: '!$', label: 'does not end with', id: 'notEndWith' },
          { value: '=', label: 'equals', id: 'equals' },
          { value: '<>', label: 'does not equal', id: 'notEquals' },
          { value: '<', label: 'is smaller', id: 'lessThan' },
          { value: '>', label: 'is greater', id: 'greaterThan' },
          { value: '<=', label: 'is smaller or equal', id: 'lessThanOrEqual' },
          { value: '>=', label: 'is greater or equal', id: 'greaterThanOrEqual' },
          { value: 'NULL', label: 'is NULL', id: 'isNull' },
          { value: 'NOT NULL', label: 'is not NULL', id: 'isNotNull' },
          { value: 'sql', label: 'SQL condition', id: 'sql' },
          { value: 'sqlRight', label: 'SQL condition - right side only', id: 'sqlRight' },
        ];
        break;
      case 'datetime':
        result = [
          { value: '=', label: 'equals', id: 'equals' },
          { value: '<>', label: 'does not equal', id: 'notEquals' },
          { value: '<', label: 'is before', id: 'lessThan' },
          { value: '>', label: 'is after', id: 'greaterThan' },
          { value: '<=', label: 'is before or equal', id: 'lessThanOrEqual' },
          { value: '>=', label: 'is after or equal', id: 'greaterThanOrEqual' },
          { value: 'NULL', label: 'is NULL', id: 'isNull' },
          { value: 'NOT NULL', label: 'is not NULL', id: 'isNotNull' },
          { value: 'sql', label: 'SQL condition', id: 'sql' },
          { value: 'sqlRight', label: 'SQL condition - right side only', id: 'sqlRight' },
        ];
        break;
      case 'mongo':
        result = [
          { value: '=', label: 'equals', id: 'equals' },
          { value: '<>', label: 'does not equal', id: 'notEquals' },
          { value: '<', label: 'is smaller', id: 'lessThan' },
          { value: '>', label: 'is greater', id: 'greaterThan' },
          { value: '<=', label: 'is smaller or equal', id: 'lessThanOrEqual' },
          { value: '>=', label: 'is greater or equal', id: 'greaterThanOrEqual' },
          { value: '+', label: 'contains', id: 'contains' },
          { value: '~', label: 'does not contain', id: 'notContain' },
          { value: '^', label: 'begins with', id: 'beginsWith' },
          { value: '!^', label: 'does not begin with', id: 'notBeginWith' },
          { value: '$', label: 'ends with', id: 'endsWith' },
          { value: '!$', label: 'does not end with', id: 'notEndWith' },
          { value: 'EXISTS', label: 'field exists', id: 'fieldExists' },
          { value: 'NOT EXISTS', label: 'field does not exist', id: 'notExists' },
        ];
        break;
      case 'eval':
        result = [
          { value: '=', label: 'equals', id: 'equals' },
          { value: '<>', label: 'does not equal', id: 'notEquals' },
          { value: '<', label: 'is smaller', id: 'lessThan' },
          { value: '>', label: 'is greater', id: 'greaterThan' },
          { value: '<=', label: 'is smaller or equal', id: 'lessThanOrEqual' },
          { value: '>=', label: 'is greater or equal', id: 'greaterThanOrEqual' },
          { value: '+', label: 'contains', id: 'contains' },
          { value: '~', label: 'does not contain', id: 'notContain' },
          { value: '^', label: 'begins with', id: 'beginsWith' },
          { value: '!^', label: 'does not begin with', id: 'notBeginWith' },
          { value: '$', label: 'ends with', id: 'endsWith' },
          { value: '!$', label: 'does not end with', id: 'notEndWith' },
          { value: 'NULL', label: 'is NULL', id: 'isNull' },
          { value: 'NOT NULL', label: 'is not NULL', id: 'isNotNull' },
        ];
        break;
    }
    result.map(item => (item.label = $t(`command.filter.${item.id}`)));
    return result;
  }
</script>

<FormSelectFieldRaw {name} options={getOptions()} isNative />
