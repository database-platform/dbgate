<script lang="ts">
  import FormProviderCore from '../forms/FormProviderCore.svelte';
  import HorizontalSplitter from '../elements/HorizontalSplitter.svelte';
  import WidgetColumnBar from '../widgets/WidgetColumnBar.svelte';
  import WidgetColumnBarItem from '../widgets/WidgetColumnBarItem.svelte';
  import ManagerInnerContainer from '../elements/ManagerInnerContainer.svelte';
  import FormSelectField from '../forms/FormSelectField.svelte';
  import FormTextField from '../forms/FormTextField.svelte';
  import FormCheckboxField from '../forms/FormCheckboxField.svelte';
  import FormFieldTemplateTiny from '../forms/FormFieldTemplateTiny.svelte';
  import { getConnectionInfo } from '../utility/metadataLoaders';
  import { findEngineDriver } from 'dbgate-tools';
  import { extensions } from '../stores';
  import { loadChartData, loadChartStructure } from './chartDataLoader';
  import DataChart from './DataChart.svelte';
  import _ from 'lodash';
  import { t } from 'svelte-i18n';
  import ErrorInfo from '../elements/ErrorInfo.svelte';
  import FormColorField from '../forms/FormColorField.svelte';

  export let data;
  export let configStore;
  export let conid;
  export let database;
  export let sql;
  // export let menu;

  let availableColumnNames = [];
  let errorLoadingColumns = null;
  let errorLoadingData = null;
  let loadedData = null;

  $: config = $configStore;

  const getDriver = async () => {
    const conn = await getConnectionInfo({ conid });
    if (!conn) return;
    const driver = findEngineDriver(conn, $extensions);
    return driver;
  };

  const handleLoadColumns = async () => {
    const driver = await getDriver();
    if (!driver) return;
    try {
      errorLoadingColumns = null;
      const columns = await loadChartStructure(driver, conid, database, sql);
      availableColumnNames = columns;
      // configStore.update(x => ({ ...x, labelColumn: availableColumnNames[0] }));
    } catch (err) {
      console.error(err);
      errorLoadingColumns = err.message;
    }
  };

  const handleLoadData = async () => {
    const driver = await getDriver();
    if (!driver) return;
    try {
      errorLoadingData = null;
      const loaded = await loadChartData(driver, conid, database, sql, config);
      if (!loaded) return;
      const { columns, rows } = loaded;
      loadedData = {
        structure: columns,
        rows,
      };
    } catch (err) {
      console.error(err);
      errorLoadingData = err.message;
    }
  };

  $: {
    $extensions;
    if (sql && conid && database) {
      handleLoadColumns();
    }
  }
  $: {
    if (data) {
      availableColumnNames = data.structure.columns.map(x => x.columnName);
    }
  }
  $: {
    $extensions;
    if (config.labelColumn && sql && conid && database) {
      handleLoadData();
    }
  }

  let managerSize;
</script>

<FormProviderCore values={configStore} template={FormFieldTemplateTiny}>
  <HorizontalSplitter initialValue="300px" bind:size={managerSize}>
    <div class="left" slot="1">
      <WidgetColumnBar>
        <WidgetColumnBarItem title={$t('tab.chart.title.style')} name="style" height="40%">
          <ManagerInnerContainer width={managerSize}>
            <FormSelectField
              label={$t('tab.chart.style.form.chartType')}
              name="chartType"
              isNative
              options={[
                { value: 'bar', label: 'Bar' },
                { value: 'line', label: 'Line' },
                { value: 'pie', label: 'Pie' },
                { value: 'polarArea', label: 'Polar area' },
              ]}
            />
            <FormTextField label={$t('tab.chart.style.form.chartTitle')} name="chartTitle" />
            <!-- <FormSelectField -->
            <!--   label={$t('tab.chart.style.form.truncateFrom')} -->
            <!--   name="truncateFrom" -->
            <!--   isNative -->
            <!--   options={[ -->
            <!--     { value: 'begin', label: 'Begin' }, -->
            <!--     { value: 'end', label: 'End (most recent data for datetime)' }, -->
            <!--   ]} -->
            <!-- /> -->
            <!-- <FormTextField label={$t('tab.chart.style.form.truncateLimit')} name="truncateLimit" /> -->
            <FormCheckboxField label={$t('tab.chart.style.form.showRelativeValues')} name="showRelativeValues" />
            {#if $configStore.chartType == 'line'}
              <FormCheckboxField label={$t('common.fill')} name="fillLineChart" defaultValue={true} />
            {/if}
            <FormTextField label={$t('tab.chart.style.form.colorSet')} name="colorSeed" />
          </ManagerInnerContainer>
        </WidgetColumnBarItem>
        <WidgetColumnBarItem title={$t('tab.chart.title.data')} name="data">
          <ManagerInnerContainer width={managerSize}>
            {#if availableColumnNames.length > 0}
              <FormSelectField
                label={$t('tab.chart.data.form.labelColumn')}
                name="labelColumn"
                isNative
                options={availableColumnNames.map(col => ({ value: col, label: col }))}
              />
            {/if}

            {#each availableColumnNames as col (col)}
              <FormCheckboxField label={col} name={`dataColumn_${col}`} />
              {#if config[`dataColumn_${col}`]}
                <FormColorField
                  label={$t('tab.chart.data.form.color')}
                  name={`dataColumnColor_${col}`}
                  emptyLabel="Random"
                />
                <FormTextField label={$t('tab.chart.data.form.label')} name={`dataColumnLabel_${col}`} />
              {/if}
            {/each}
          </ManagerInnerContainer>
        </WidgetColumnBarItem>
      </WidgetColumnBar>
    </div>

    <svelte:fragment slot="2">
      {#if errorLoadingColumns}
        <ErrorInfo message={errorLoadingColumns} alignTop />
      {:else if errorLoadingData}
        <ErrorInfo message={errorLoadingData} alignTop />
      {:else}
        <DataChart data={data || loadedData} />
      {/if}
    </svelte:fragment>
  </HorizontalSplitter>
</FormProviderCore>

<style>
  .left {
    background-color: var(--theme-bg-0);
    display: flex;
    flex: 1;
  }
</style>
