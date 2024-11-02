<script lang="ts">
  import { findEngineDriver } from 'dbgate-tools';
  import { currentDatabase, extensions, pinnedDatabases, pinnedTables } from '../stores';
  import { useConfig, useConnectionInfo } from '../utility/metadataLoaders';

  import ConnectionList from './ConnectionList.svelte';
  import PinnedObjectsList from './PinnedObjectsList.svelte';
  import ErrorInfo from '../elements/ErrorInfo.svelte';
  import WidgetsInnerContainer from './WidgetsInnerContainer.svelte';

  import WidgetColumnBar from './WidgetColumnBar.svelte';
  import WidgetColumnBarItem from './WidgetColumnBarItem.svelte';
  import SqlObjectList from './SqlObjectList.svelte';
  import DbKeysTree from './DbKeysTree.svelte';
  import SingleConnectionDatabaseList from './SingleConnectionDatabaseList.svelte';
  import { compact } from 'lodash';
  import { _ } from 'svelte-i18n';

  export let hidden = false;
  let singleDatabase = false;
  let database = null;
  let conid = null;
  $: {
    const username = $currentDatabase?.connection?._id.split('_')[0];
    const userInfo = JSON.parse(localStorage.getItem('user-info'));
    if (username === userInfo.username) {
      singleDatabase = $currentDatabase?.connection.singleDatabase;
      database = $currentDatabase.name;
      conid = $currentDatabase.connection._id;
    } else {
      conid = null;
      database = null;
      singleDatabase = null;
    }
  }
  // $: singleDatabase = $currentDatabase?.connection?.singleDatabase;
  // $: database = $currentDatabase?.name;
  // $: conid = $currentDatabase?.connection?._id;
  $: connection = useConnectionInfo({ conid });
  $: driver = findEngineDriver($connection, $extensions);
  $: config = useConfig();
  // $: console.log('=$currentDatabase: ', $currentDatabase, conid);
</script>

<WidgetColumnBar {hidden}>
  {#if $config?.singleConnection}
    <WidgetColumnBarItem
      title={$_('widgets.database.connectionTitle')}
      name="databases"
      height="35%"
      storageName="databasesWidget"
    >
      <SingleConnectionDatabaseList connection={$config?.singleConnection} />
    </WidgetColumnBarItem>
  {:else if !$config?.singleDbConnection}
    <WidgetColumnBarItem
      title={$_('widgets.database.connectionTitle')}
      name="connections"
      height="35%"
      storageName="connectionsWidget"
      hrStyle="margin-bottom: 0;"
    >
      <ConnectionList />
    </WidgetColumnBarItem>
  {/if}
  <WidgetColumnBarItem
    title="Pinned"
    name="pinned"
    height="15%"
    storageName="pinnedItemsWidget"
    skip={!compact($pinnedDatabases).length &&
      !$pinnedTables.some(x => x && x.conid == conid && x.database == $currentDatabase?.name)}
  >
    <PinnedObjectsList />
  </WidgetColumnBarItem>

  <WidgetColumnBarItem
    title={driver?.databaseEngineTypes?.includes('document')
      ? $_('widgets.database.objectDocumentTitle')
      : $_('widgets.database.objectTitle')}
    name="dbObjects"
    storageName="dbObjectsWidget"
    skip={!(
      conid &&
      (database || singleDatabase) &&
      (driver?.databaseEngineTypes?.includes('sql') || driver?.databaseEngineTypes?.includes('document'))
    )}
  >
    <SqlObjectList {conid} {database} />
  </WidgetColumnBarItem>

  <WidgetColumnBarItem
    title={'Keys'}
    name="dbObjects"
    storageName="dbObjectsWidget"
    skip={!(conid && (database || singleDatabase) && driver?.databaseEngineTypes?.includes('keyvalue'))}
  >
    <DbKeysTree {conid} {database} />
  </WidgetColumnBarItem>

  <WidgetColumnBarItem
    title={$_('widgets.database.contentTitle')}
    name="dbObjects"
    storageName="dbObjectsWidget"
    skip={conid && (database || singleDatabase)}
  >
    <WidgetsInnerContainer>
      <ErrorInfo message={$_('widgets.database.contentError')} icon="img alert" />
    </WidgetsInnerContainer>
  </WidgetColumnBarItem>
</WidgetColumnBar>
