<script lang="ts" context="module">
  import { copyTextToClipboard } from '../utility/clipboard';
  import { hasDataPermission, PERMISSION } from '../utility/hasPermission';

  export const extractKey = props => props.name;

  export function disconnectDatabaseConnection(conid, database, showConfirmation = true) {
    const closeCondition = x =>
      x.props?.conid == conid &&
      x.props?.database == database &&
      x.tabComponent != 'ConnectionTab' &&
      x.closedTime == null;

    if (showConfirmation) {
      const count = getOpenedTabs().filter(closeCondition).length;
      if (count > 0) {
        showModal(ConfirmModal, {
          message: `Closing connection will close ${count} opened tabs, continue?`,
          onConfirm: () => disconnectDatabaseConnection(conid, database, false),
        });
        return;
      }
    }

    const electron = getElectron();
    if (electron) {
      apiCall('database-connections/disconnect', { conid, database });
    }
    if (getCurrentDatabase()?.connection?._id == conid && getCurrentDatabase()?.name == database) {
      currentDatabase.set(null);
    }
    openedSingleDatabaseConnections.update(list => list.filter(x => x != conid));
    closeMultipleTabs(closeCondition);
  }

  export function getDatabaseMenuItems(
    connection,
    name,
    $extensions,
    $currentDatabase,
    $apps,
    $openedSingleDatabaseConnections,
    $__,
    permission
  ) {
    const apps2 = filterAppsForDatabase(connection, name, $apps);
    const handleNewQuery = () => {
      const tooltip = `${getConnectionLabel(connection)}\n${name}`;
      openNewTab({
        title: $__('tab.common.query'),
        icon: 'img sql-file',
        tooltip,
        tabComponent: 'QueryTab',
        props: {
          conid: connection._id,
          database: name,
        },
      });
    };

    const handleNewTable = () => {
      const tooltip = `${getConnectionLabel(connection)}\n${name}`;
      openNewTab(
        {
          title: $__('tab.common.table'),
          tooltip,
          icon: 'img table-structure',
          tabComponent: 'TableStructureTab',
          props: {
            conid: connection._id,
            database: name,
          },
        },
        {
          editor: {
            columns: [],
          },
        },
        {
          forceNewTab: true,
        }
      );
    };

    const handleDropDatabase = () => {
      showModal(ConfirmModal, {
        message: $__('message.dropDatabase', { values: { name } }),
        onConfirm: () =>
          apiCall('server-connections/drop-database', {
            conid: connection._id,
            name,
          }),
      });
    };

    const handleNewCollection = () => {
      showModal(InputTextModal, {
        value: '',
        label: $__('modal.collection.label'),
        header: $__('modal.collection.header'),
        onConfirm: async newCollection => {
          saveScriptToDatabase({ conid: connection._id, database: name }, `db.createCollection('${newCollection}')`);
        },
      });
    };

    const handleImport = () => {
      showModal(ImportExportModal, {
        initialValues: {
          sourceStorageType: getDefaultFileFormat($extensions).storageType,
          targetStorageType: 'database',
          targetConnectionId: connection._id,
          targetDatabaseName: name,
        },
      });
    };

    const handleExport = () => {
      showModal(ImportExportModal, {
        initialValues: {
          targetStorageType: getDefaultFileFormat($extensions).storageType,
          sourceStorageType: 'database',
          sourceConnectionId: connection._id,
          sourceDatabaseName: name,
        },
      });
    };

    const handleSqlGenerator = () => {
      showModal(SqlGeneratorModal, {
        conid: connection._id,
        database: name,
      });
    };

    const handleSqlDump = () => {
      showModal(ExportDatabaseDumpModal, {
        connection: { ...connection, database: name },
      });
      // exportSqlDump(connection, name);
    };

    const handleSqlRestore = () => {
      showModal(ImportDatabaseDumpModal, {
        connection: { ...connection, database: name },
      });
    };

    const handleShowDiagram = async () => {
      const db = await getDatabaseInfo({
        conid: connection._id,
        database: name,
      });
      openNewTab(
        {
          title: $__('tab.common.diagram'),
          icon: 'img diagram',
          tabComponent: 'DiagramTab',
          props: {
            conid: connection._id,
            database: name,
          },
        },
        {
          editor: {
            tables: db.tables.map(table => ({
              ...table,
              designerId: `${table.pureName}-${uuidv1()}`,
            })),
            references: [],
            autoLayout: true,
          },
        }
      );
    };

    const handleCopyName = async () => {
      copyTextToClipboard(name);
    };

    const handleDisconnect = () => {
      disconnectDatabaseConnection(connection._id, name);
    };

    const handleExportModel = async () => {
      const resp = await apiCall('database-connections/export-model', {
        conid: connection._id,
        database: name,
      });
      currentArchive.set(resp.archiveFolder);
      selectedWidget.set('archive');
      visibleWidgetSideBar.set(true);
      showSnackbarSuccess($__('message.archiveFolder', { values: { archiveFolder: resp.archiveFolder } }));
    };

    const handleCompareWithCurrentDb = () => {
      openNewTab(
        {
          title: $__('tab.common.compare'),
          icon: 'img compare',
          tabComponent: 'CompareModelTab',
        },
        {
          editor: {
            sourceConid: _.get($currentDatabase, 'connection._id'),
            sourceDatabase: _.get($currentDatabase, 'name'),
            targetConid: _.get(connection, '_id'),
            targetDatabase: name,
          },
        }
      );
    };

    const handleOpenJsonModel = async () => {
      const db = await getDatabaseInfo({
        conid: connection._id,
        database: name,
      });
      openJsonDocument(db, name);
    };

    const handleGenerateScript = async () => {
      const data = await apiCall('database-connections/export-keys', {
        conid: connection?._id,
        database: name,
        options: {
          keyPrefix: '',
        },
      });

      if (data.errorMessage) {
        showSnackbarError(data.errorMessage);
        return;
      }

      newQuery({
        title: $__('tab.common.generateScriptExport'),
        initialData: data,
      });
    };

    const handleQueryDesigner = () => {
      openNewTab({
        title: $__('tab.common.query'),
        icon: 'img query-design',
        tabComponent: 'QueryDesignTab',
        props: {
          conid: connection._id,
          database: name,
        },
      });
    };

    const handleNewPerspective = () => {
      openNewTab({
        title: $__('tab.common.perspective'),
        icon: 'img perspective',
        tabComponent: 'PerspectiveTab',
        props: {
          conid: connection._id,
          database: name,
        },
      });
    };

    const handleDatabaseProfiler = () => {
      openNewTab({
        title: $__('tab.common.profiler'),
        icon: 'img profiler',
        tabComponent: 'ProfilerTab',
        props: {
          conid: connection._id,
          database: name,
        },
      });
    };

    async function handleConfirmSql(sql) {
      saveScriptToDatabase({ conid: connection._id, database: name }, sql, false);
    }

    const driver = findEngineDriver(connection, getExtensions());

    const commands = _.flatten((apps2 || []).map(x => x.commands || []));

    const isSqlOrDoc =
      driver?.databaseEngineTypes?.includes('sql') || driver?.databaseEngineTypes?.includes('document');
    return [
      { onClick: handleNewQuery, text: $__('contextMenu.common.newQuery'), isNewQuery: true },
      hasDataPermission(permission, PERMISSION.DDL, PERMISSION.DDL_CREATE) &&
        driver?.databaseEngineTypes?.includes('sql') && {
          onClick: handleNewTable,
          text: $__('contextMenu.database.newTable'),
        },
      hasDataPermission(permission, PERMISSION.DDL, PERMISSION.DDL_CREATE) &&
        driver?.databaseEngineTypes?.includes('document') && {
          onClick: handleNewCollection,
          text: $__('contextMenu.database.newCollection'),
        },
      driver?.databaseEngineTypes?.includes('sql') && {
        onClick: handleQueryDesigner,
        text: $__('contextMenu.database.designQuery'),
      },
      driver?.databaseEngineTypes?.includes('sql') && {
        onClick: handleNewPerspective,
        text: $__('contextMenu.database.designPerspectiveQuery'),
      },
      { divider: true },
      // isSqlOrDoc && !connection.isReadOnly && { onClick: handleImport, text: $__('contextMenu.database.importWizard') },
      // isSqlOrDoc && { onClick: handleExport, text: $__('contextMenu.database.exportWizard') },
      // driver?.databaseEngineTypes?.includes('sql') && {
      //   onClick: handleSqlRestore,
      //   text: $__('contextMenu.common.restoreSqlDump'),
      // },
      // driver?.supportsDatabaseDump && { onClick: handleSqlDump, text: $__('contextMenu.common.backupSqlDump') },
      hasDataPermission(permission, PERMISSION.DDL, PERMISSION.DDL_CREATE) &&
        isSqlOrDoc &&
        !connection.isReadOnly &&
        !connection.singleDatabase && { onClick: handleDropDatabase, text: $__('contextMenu.database.dropDatabase') },
      { divider: true },
      driver?.databaseEngineTypes?.includes('sql') && {
        onClick: handleCopyName,
        text: $__('contextMenu.database.copyDatabaseName'),
      },
      driver?.databaseEngineTypes?.includes('sql') && {
        onClick: handleShowDiagram,
        text: $__('contextMenu.database.showDiagram'),
      },
      driver?.databaseEngineTypes?.includes('sql') && {
        onClick: handleSqlGenerator,
        text: $__('contextMenu.database.sqlGenerator'),
      },
      driver?.supportsDatabaseProfiler && {
        onClick: handleDatabaseProfiler,
        text: $__('contextMenu.database.databaseProfiler'),
      },
      // isSqlOrDoc && { onClick: handleOpenJsonModel, text: $__('contextMenu.database.openJsonModel') },
      // isSqlOrDoc && { onClick: handleExportModel, text: $__('contextMenu.database.exportModel') },
      // isSqlOrDoc &&
      //   _.get($currentDatabase, 'connection._id') &&
      //   (_.get($currentDatabase, 'connection._id') != _.get(connection, '_id') ||
      //     (_.get($currentDatabase, 'connection._id') == _.get(connection, '_id') &&
      //       _.get($currentDatabase, 'name') != _.get(connection, 'name'))) && {
      //     onClick: handleCompareWithCurrentDb,
      //     text: $__('contextMenu.database.compareDatabase', {
      //       values: { currentDatabaseName: _.get($currentDatabase, 'name') },
      //     }),
      //   },

      driver?.databaseEngineTypes?.includes('keyvalue') && {
        onClick: handleGenerateScript,
        text: $__('contextMenu.database.generateScript'),
      },

      ($openedSingleDatabaseConnections.includes(connection._id) ||
        (_.get($currentDatabase, 'connection._id') == _.get(connection, '_id') &&
          _.get($currentDatabase, 'name') == name)) && {
        onClick: handleDisconnect,
        text: $__('contextMenu.connection.disconnect'),
      },

      commands.length > 0 && [
        { divider: true },
        commands.map((cmd: any) => ({
          text: cmd.name,
          onClick: () => {
            showModal(ConfirmSqlModal, {
              sql: cmd.sql,
              onConfirm: () => handleConfirmSql(cmd.sql),
              engine: driver.engine,
            });
          },
        })),
      ],
    ];
  }
</script>

<script lang="ts">
  import getConnectionLabel from '../utility/getConnectionLabel';
  import uuidv1 from 'uuid/v1';

  import _ from 'lodash';
  import { _ as __ } from 'svelte-i18n';
  import ImportExportModal from '../modals/ImportExportModal.svelte';
  import { showModal } from '../modals/modalTools';
  import SqlGeneratorModal from '../modals/SqlGeneratorModal.svelte';
  import { getDefaultFileFormat } from '../plugins/fileformats';
  import {
    currentArchive,
    currentDatabase,
    extensions,
    getCurrentDatabase,
    getExtensions,
    getOpenedTabs,
    // openedConnections,
    openedSingleDatabaseConnections,
    pinnedDatabases,
    selectedWidget,
    visibleWidgetSideBar,
  } from '../stores';
  import getElectron from '../utility/getElectron';
  import openNewTab from '../utility/openNewTab';
  import AppObjectCore from './AppObjectCore.svelte';
  import { showSnackbarError, showSnackbarSuccess } from '../utility/snackbar';
  import { findEngineDriver } from 'dbgate-tools';
  import InputTextModal from '../modals/InputTextModal.svelte';
  import { getDatabaseInfo, useUsedApps } from '../utility/metadataLoaders';
  import { openJsonDocument } from '../tabs/JsonTab.svelte';
  import { apiCall } from '../utility/api';
  // import ErrorMessageModal from '../modals/ErrorMessageModal.svelte';
  import ConfirmSqlModal, { saveScriptToDatabase } from '../modals/ConfirmSqlModal.svelte';
  import { filterAppsForDatabase } from '../utility/appTools';
  import newQuery from '../query/newQuery';
  // import { exportSqlDump } from '../utility/exportFileTools';
  import ImportDatabaseDumpModal from '../modals/ImportDatabaseDumpModal.svelte';
  import ExportDatabaseDumpModal from '../modals/ExportDatabaseDumpModal.svelte';
  import ConfirmModal from '../modals/ConfirmModal.svelte';
  import { closeMultipleTabs } from '../tabpanel/TabsPanel.svelte';

  export let data;
  export let passProps;

  function createMenu() {
    return getDatabaseMenuItems(
      data.connection,
      data.name,
      $extensions,
      $currentDatabase,
      $apps,
      $openedSingleDatabaseConnections,
      $__,
      data.permission
    );
  }

  function handleClick() {
    $currentDatabase = data;
  }

  $: isPinned = !!$pinnedDatabases.find(x => x?.name == data.name && x?.connection?._id == data.connection?._id);
  $: apps = useUsedApps();
</script>

<AppObjectCore
  {...$$restProps}
  {data}
  title={data.name}
  extInfo={data.extInfo}
  icon="img database"
  colorMark={passProps?.connectionColorFactory &&
    passProps?.connectionColorFactory({ conid: _.get(data.connection, '_id'), database: data.name }, null, null, false)}
  isBold={_.get($currentDatabase, 'connection._id') == _.get(data.connection, '_id') &&
    _.get($currentDatabase, 'name') == data.name}
  on:click={() => handleClick()}
  on:dragstart
  on:dragenter
  on:dragend
  on:drop
  on:middleclick={() => {
    createMenu()
      .find(x => x.isNewQuery)
      .onClick();
  }}
  menu={createMenu}
  showPinnedInsteadOfUnpin={passProps?.showPinnedInsteadOfUnpin}
  onPin={isPinned ? null : () => pinnedDatabases.update(list => [...list, data])}
  onUnpin={isPinned
    ? () =>
        pinnedDatabases.update(list =>
          list.filter(x => x?.name != data?.name || x?.connection?._id != data?.connection?._id)
        )
    : null}
/>
