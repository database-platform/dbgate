<script lang="ts" context="module">
  // function generateObjectList(seed = 0) {
  //   const counts = [1000, 1200, 1100, 2100, 720];
  //   const schemas = ['A', 'dev', 'public', 'dbo'];
  //   const types = ['tables', 'views', 'functions', 'procedures', 'matviews', 'triggers'];
  //   const res = _.range(1, counts[seed % counts.length]).map(i => ({
  //     pureName: `name ${i}`,
  //     schemaName: schemas[i % schemas.length],
  //     objectTypeField: types[i % types.length],
  //   }));
  //   return res;
  // }
</script>

<script lang="ts">
  import InlineButton from '../buttons/InlineButton.svelte';
  import SearchInput from '../elements/SearchInput.svelte';
  import WidgetsInnerContainer from './WidgetsInnerContainer.svelte';
  import { useConnectionInfo, useDatabaseInfo, useDatabaseStatus, useUsedApps } from '../utility/metadataLoaders';
  import SearchBoxWrapper from '../elements/SearchBoxWrapper.svelte';
  import AppObjectList from '../appobj/AppObjectList.svelte';
  import _ from 'lodash';
  import { t } from 'svelte-i18n';
  import * as databaseObjectAppObject from '../appobj/DatabaseObjectAppObject.svelte';
  import SubColumnParamList from '../appobj/SubColumnParamList.svelte';
  import { chevronExpandIcon } from '../icons/expandIcons';
  import ErrorInfo from '../elements/ErrorInfo.svelte';
  import LoadingInfo from '../elements/LoadingInfo.svelte';
  import { getObjectTypeFieldLabel } from '../utility/common';
  import DropDownButton from '../buttons/DropDownButton.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import CloseSearchButton from '../buttons/CloseSearchButton.svelte';
  import { findEngineDriver } from 'dbgate-tools';
  import { currentDatabase, extensions } from '../stores';
  import newQuery from '../query/newQuery';
  import runCommand from '../commands/runCommand';
  import { apiCall } from '../utility/api';
  import { filterAppsForDatabase } from '../utility/appTools';
  import { hasDataPermission, PERMISSION } from '../utility/hasPermission';

  export let conid;
  export let database;

  let filter = '';

  $: objects = useDatabaseInfo({ conid, database });
  $: status = useDatabaseStatus({ conid, database });

  $: connection = useConnectionInfo({ conid });
  $: driver = findEngineDriver($connection, $extensions);

  $: apps = useUsedApps();

  $: dbApps = filterAppsForDatabase($currentDatabase?.connection, $currentDatabase?.name, $apps || []);

  $: objectList = _.flatten([
    ...['tables', 'collections', 'views', 'matviews', 'procedures', 'functions'].map(objectTypeField =>
      _.sortBy(
        (($objects || {})[objectTypeField] || []).map(obj => ({ ...obj, objectTypeField })),
        ['schemaName', 'pureName']
      )
    ),
    ...dbApps.map(app =>
      app.queries.map(query => ({
        objectTypeField: 'queries',
        pureName: query.name,
        schemaName: app.name,
        sql: query.sql,
      }))
    ),
  ]);

  $: console.log('sqlObjectList: ', $objects, objectList);

  // let generateIndex = 0;
  // setInterval(() => (generateIndex += 1), 2000);
  // $: objectList = generateObjectList(generateIndex);

  const handleRefreshDatabase = () => {
    apiCall('database-connections/refresh', { conid, database });
  };

  function createAddMenu() {
    const res = [];
    if (driver?.databaseEngineTypes?.includes('document')) {
      res.push({ command: 'new.collection' });
    }
    if (driver?.databaseEngineTypes?.includes('sql')) {
      res.push({ command: 'new.table' });
    }
    if (driver)
      res.push(
        ...driver.getNewObjectTemplates().map(tpl => ({
          text: $t(`widgets.sqlObjectList.menus.${tpl.label}`),
          onClick: () => {
            newQuery({
              initialData: tpl.sql,
            });
          },
        }))
      );
    res[0].text = $t('widgets.sqlObjectList.menus.new.table');
    return res;
  }
</script>

{#if $status && $status.name == 'error'}
  <WidgetsInnerContainer>
    <ErrorInfo message={$status.message} icon="img error" />
    <InlineButton on:click={handleRefreshDatabase}>{$t('common.refresh')}</InlineButton>
  </WidgetsInnerContainer>
{:else if objectList.length == 0 && $status && $status.name != 'pending' && $status.name != 'checkStructure' && $status.name != 'loadStructure' && $objects}
  <WidgetsInnerContainer>
    <ErrorInfo message={$t('widgets.sqlObjectList.error', { values: { database } })} icon="img alert" />
    <div class="m-1" />
    <InlineButton on:click={handleRefreshDatabase}>{$t('common.refresh')}</InlineButton>
    {#if hasDataPermission($currentDatabase?.permission, PERMISSION.DDL, PERMISSION.DDL_CREATE) && driver?.databaseEngineTypes?.includes('sql')}
      <div class="m-1" />
      <InlineButton on:click={() => runCommand('new.table')}>{$t('contextMenu.database.newTable')}</InlineButton>
    {/if}
    {#if hasDataPermission($currentDatabase?.permission, PERMISSION.DDL, PERMISSION.DDL_CREATE) && driver?.databaseEngineTypes?.includes('document')}
      <div class="m-1" />
      <InlineButton on:click={() => runCommand('new.collection')}
        >{$t('contextMenu.database.newCollection')}</InlineButton
      >
    {/if}
  </WidgetsInnerContainer>
{:else}
  <SearchBoxWrapper>
    <SearchInput placeholder={$t('widgets.sqlObjectList.search')} bind:value={filter} />
    <CloseSearchButton bind:filter />
    {#if hasDataPermission($currentDatabase?.permission, PERMISSION.DDL, PERMISSION.DDL_CREATE)}
      <DropDownButton icon="icon plus-thick" menu={createAddMenu} />
    {/if}
    <InlineButton on:click={handleRefreshDatabase} title={$t('widgets.sqlObjectList.refresh')}>
      <FontIcon icon="icon refresh" />
    </InlineButton>
  </SearchBoxWrapper>
  <WidgetsInnerContainer>
    {#if ($status && ($status.name == 'pending' || $status.name == 'checkStructure' || $status.name == 'loadStructure') && $objects) || !$objects}
      <LoadingInfo message={$status?.feedback?.analysingMessage || 'Loading database structure'} />
    {:else}
      <AppObjectList
        list={objectList.map(x => ({ ...x, conid, database }))}
        module={databaseObjectAppObject}
        groupFunc={data => getObjectTypeFieldLabel(data.objectTypeField)}
        subItemsComponent={SubColumnParamList}
        isExpandable={data =>
          data.objectTypeField == 'tables' || data.objectTypeField == 'views' || data.objectTypeField == 'matviews'}
        expandIconFunc={chevronExpandIcon}
        {filter}
        passProps={{ showPinnedInsteadOfUnpin: true, connection: $connection }}
      />
    {/if}
  </WidgetsInnerContainer>
{/if}
