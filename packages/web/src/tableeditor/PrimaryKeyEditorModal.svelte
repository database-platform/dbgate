<script lang="ts">
  import { t } from 'svelte-i18n';
  import ColumnsConstraintEditorModal from './ColumnsConstraintEditorModal.svelte';

  export let constraintInfo;
  export let setTableInfo;
  export let tableInfo;
</script>

<ColumnsConstraintEditorModal
  {...$$restProps}
  constraintLabel={$t('tab.tableStructure.title.primaryKey')}
  constraintType="primaryKey"
  {constraintInfo}
  {setTableInfo}
  {tableInfo}
/>
