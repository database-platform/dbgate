<script lang="ts">
  import { t } from 'svelte-i18n';
  import FormDropDownTextField from '../forms/FormDropDownTextField.svelte';
  import { getFormContext } from '../forms/FormProviderCore.svelte';

  const { setFieldValue } = getFormContext();

  $: dataTypes = dialect?.predefinedDataTypes || ['int', 'varchar(250)', 'datetime', 'numeric(10,2)', 'float'];

  function createDataTypesMenu() {
    return dataTypes.map(type => ({
      text: type,
      onClick: () => setFieldValue('dataType', type),
    }));
  }

  export let dialect;
</script>

<FormDropDownTextField name="dataType" label={$t('tab.tableStructure.columns.dataType')} menu={createDataTypesMenu} />
