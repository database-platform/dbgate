<script lang="ts" context="module">
  import { copyTextToClipboard } from '../utility/clipboard';
  import { translate } from '../i18nConfig';

  export const extractKey = ({ schemaName, pureName }) => (schemaName ? `${schemaName}.${pureName}` : pureName);
  export const createMatcher =
    ({ schemaName, pureName, columns }) =>
    filter =>
      filterName(
        filter,
        pureName,
        schemaName,
        ...(columns?.map(({ columnName }) => ({ childName: columnName })) || [])
      );
  export const createTitle = ({ schemaName, pureName }) => (schemaName ? `${schemaName}.${pureName}` : pureName);

  export const databaseObjectIcons = {
    tables: 'img table',
    collections: 'img collection',
    views: 'img view',
    matviews: 'img view',
    procedures: 'img procedure',
    functions: 'img function',
    queries: 'img query-data',
  };

  const defaultTabs = {
    tables: 'TableDataTab',
    collections: 'CollectionDataTab',
    views: 'ViewDataTab',
    matviews: 'ViewDataTab',
    queries: 'QueryDataTab',
  };

  const menus = {
    tables: [
      {
        label: '__contextMenu.dbobject.openData',
        tab: 'TableDataTab',
        forceNewTab: true,
      },
      {
        label: '__contextMenu.dbobject.openForm',
        tab: 'TableDataTab',
        forceNewTab: true,
        initialData: {
          grid: {
            isFormView: true,
          },
        },
      },
      {
        label: '__contextMenu.dbobject.openStructure',
        tab: 'TableStructureTab',
        icon: 'img table-structure',
      },
      {
        label: '__contextMenu.dbobject.designQuery',
        isQueryDesigner: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.designPerspectiveQuery',
        tab: 'PerspectiveTab',
        forceNewTab: true,
        icon: 'img perspective',
      },
      {
        divider: true,
      },
      {
        label: '__contextMenu.dbobject.dropTable',
        isDrop: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.renameTable',
        isRename: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.truncateTable',
        isTruncate: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.copyTableName',
        isCopyTableName: true,
        requiresWriteAccess: false,
      },
      {
        label: '__contextMenu.dbobject.createTableBackup',
        isDuplicateTable: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.showDiagram',
        isDiagram: true,
      },
      {
        divider: true,
      },
      {
        label: '__contextMenu.common.export',
        functionName: 'tableReader',
        isExport: true,
      },
      {
        label: '__contextMenu.common.import',
        isImport: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.openActiveChart',
        isActiveChart: true,
      },
      {
        divider: true,
      },
      {
        label: 'SQL: CREATE TABLE',
        scriptTemplate: 'CREATE TABLE',
      },
      {
        label: 'SQL: SELECT',
        scriptTemplate: 'SELECT',
      },
      {
        label: 'SQL Generator: CREATE TABLE',
        sqlGeneratorProps: {
          createTables: true,
          createIndexes: true,
          createForeignKeys: true,
        },
      },
      {
        label: 'SQL Generator: DROP TABLE',
        sqlGeneratorProps: {
          dropTables: true,
          dropReferences: true,
        },
      },
      {
        label: 'SQL Generator: INSERT',
        sqlGeneratorProps: {
          insert: true,
        },
      },
    ],
    views: [
      {
        label: '__contextMenu.dbobject.openData',
        tab: 'ViewDataTab',
        forceNewTab: true,
      },
      {
        label: '__contextMenu.dbobject.openStructure',
        tab: 'TableStructureTab',
        icon: 'img view-structure',
      },
      {
        label: '__contextMenu.dbobject.designQuery',
        isQueryDesigner: true,
      },
      {
        label: '__contextMenu.dbobject.designPerspectiveQuery',
        tab: 'PerspectiveTab',
        forceNewTab: true,
        icon: 'img perspective',
      },
      {
        label: '__contextMenu.dbobject.dropView',
        isDrop: true,
      },
      {
        divider: true,
      },
      {
        label: '__contextMenu.common.export',
        isExport: true,
        functionName: 'tableReader',
      },
      {
        label: '__contextMenu.dbobject.openActiveChart',
        isActiveChart: true,
      },
      {
        divider: true,
      },
      {
        label: 'SQL: CREATE VIEW',
        scriptTemplate: 'CREATE OBJECT',
      },
      {
        label: 'SQL: ALTER VIEW',
        scriptTemplate: 'ALTER OBJECT',
      },
      {
        label: 'SQL: CREATE TABLE',
        scriptTemplate: 'CREATE TABLE',
      },
      {
        label: 'SQL: SELECT',
        scriptTemplate: 'SELECT',
      },
      {
        label: 'SQL Generator: CREATE VIEW',
        sqlGeneratorProps: {
          createViews: true,
        },
      },
      {
        label: 'SQL Generator: DROP VIEW',
        sqlGeneratorProps: {
          dropViews: true,
        },
      },
    ],
    matviews: [
      {
        label: '__contextMenu.dbobject.openData',
        tab: 'ViewDataTab',
        forceNewTab: true,
      },
      {
        label: '__contextMenu.dbobject.openStructure',
        tab: 'TableStructureTab',
      },
      {
        label: '__contextMenu.dbobject.dropView',
        isDrop: true,
      },
      {
        label: '__contextMenu.dbobject.queryDesigner',
        isQueryDesigner: true,
      },
      {
        divider: true,
      },
      {
        label: '__contextMenu.common.export',
        isExport: true,
        functionName: 'tableReader',
      },
      {
        label: '__contextMenu.dbobject.openActiveChart',
        isActiveChart: true,
      },
      {
        divider: true,
      },
      {
        label: 'SQL: CREATE MATERIALIZED VIEW',
        scriptTemplate: 'CREATE OBJECT',
      },
      {
        label: 'SQL: ALTER MATERIALIZED VIEW',
        scriptTemplate: 'ALTER OBJECT',
      },
      {
        label: 'SQL: CREATE TABLE',
        scriptTemplate: 'CREATE TABLE',
      },
      {
        label: 'SQL: SELECT',
        scriptTemplate: 'SELECT',
      },
      {
        label: 'SQL Generator: CREATE MATERIALIZED VIEW',
        sqlGeneratorProps: {
          createMatviews: true,
        },
      },
      {
        label: 'SQL Generator: DROP MATERIALIZED VIEW',
        sqlGeneratorProps: {
          dropMatviews: true,
        },
      },
    ],
    queries: [
      {
        label: '__contextMenu.dbobject.openData',
        tab: 'QueryDataTab',
        forceNewTab: true,
      },
    ],
    procedures: [
      {
        label: '__contextMenu.dbobject.dropProcedure',
        isDrop: true,
      },
      {
        label: 'SQL: CREATE PROCEDURE',
        scriptTemplate: 'CREATE OBJECT',
      },
      {
        label: 'SQL: ALTER PROCEDURE',
        scriptTemplate: 'ALTER OBJECT',
      },
      {
        label: 'SQL: EXECUTE',
        scriptTemplate: 'EXECUTE PROCEDURE',
      },
      {
        label: 'SQL Generator: CREATE PROCEDURE',
        sqlGeneratorProps: {
          createProcedures: true,
        },
      },
      {
        label: 'SQL Generator: DROP PROCEDURE',
        sqlGeneratorProps: {
          dropProcedures: true,
        },
      },
    ],
    functions: [
      {
        label: '__contextMenu.dbobject.dropFunction',
        isDrop: true,
      },
      {
        label: 'SQL: CREATE FUNCTION',
        scriptTemplate: 'CREATE OBJECT',
      },
      {
        label: 'SQL: ALTER FUNCTION',
        scriptTemplate: 'ALTER OBJECT',
      },
      {
        label: 'SQL Generator: CREATE FUNCTION',
        sqlGeneratorProps: {
          createFunctions: true,
        },
      },
      {
        label: 'SQL Generator: DROP FUNCTION',
        sqlGeneratorProps: {
          dropFunctions: true,
        },
      },
    ],
    collections: [
      {
        label: '__contextMenu.dbobject.openData',
        tab: 'CollectionDataTab',
        forceNewTab: true,
      },
      {
        label: '__contextMenu.dbobject.openJSON',
        tab: 'CollectionDataTab',
        forceNewTab: true,
        initialData: {
          grid: {
            isJsonView: true,
          },
        },
      },
      {
        label: '__contextMenu.dbobject.designPerspectiveQuery',
        tab: 'PerspectiveTab',
        forceNewTab: true,
        icon: 'img perspective',
      },
      {
        label: '__contextMenu.common.export',
        isExport: true,
        functionName: 'tableReader',
      },
      {
        label: '__contextMenu.dbobject.dropCollection',
        isDropCollection: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.renameCollection',
        isRenameCollection: true,
        requiresWriteAccess: true,
      },
      {
        label: '__contextMenu.dbobject.createCollectionBackup',
        isDuplicateCollection: true,
        requiresWriteAccess: true,
      },
      {
        divider: true,
      },
      {
        label: 'JS: dropCollection()',
        scriptTemplate: 'dropCollection',
      },
      {
        label: 'JS: find()',
        scriptTemplate: 'findCollection',
      },
    ],
  };

  async function databaseObjectMenuClickHandler(data, menu) {
    const getDriver = async () => {
      const conn = await getConnectionInfo(data);
      if (!conn) return;
      const driver = findEngineDriver(conn, getExtensions());
      return driver;
    };

    if (menu.isActiveChart) {
      const driver = await getDriver();
      const dmp = driver.createDumper();
      dmp.put('^select * from %f', data);
      openNewTab(
        {
          title: data.pureName,
          icon: 'img chart',
          tabComponent: 'ChartTab',
          props: {
            conid: data.conid,
            database: data.database,
          },
        },
        {
          editor: {
            config: { chartType: 'bar' },
            sql: dmp.s,
          },
        }
      );
    } else if (menu.isQueryDesigner) {
      openNewTab(
        {
          title: translate('tab.common.query'),
          icon: 'img query-design',
          tabComponent: 'QueryDesignTab',
          props: {
            conid: data.conid,
            database: data.database,
          },
        },
        {
          editor: {
            tables: [
              {
                ...data,
                designerId: uuidv1(),
                left: 50,
                top: 50,
              },
            ],
          },
        }
      );
    } else if (menu.isDiagram) {
      openNewTab(
        {
          title: translate('tab.common.diagram'),
          icon: 'img diagram',
          tabComponent: 'DiagramTab',
          props: {
            conid: data.conid,
            database: data.database,
          },
        },
        {
          editor: {
            tables: [
              {
                ...data,
                designerId: `${data.pureName}-${uuidv1()}`,
                autoAddReferences: true,
              },
            ],
            references: [],
            autoLayout: true,
          },
        }
      );
    } else if (menu.sqlGeneratorProps) {
      showModal(SqlGeneratorModal, {
        initialObjects: [data],
        initialConfig: menu.sqlGeneratorProps,
        conid: data.conid,
        database: data.database,
      });
    } else if (menu.isDrop) {
      const { conid, database } = data;
      alterDatabaseDialog(conid, database, db => {
        _.remove(
          db[data.objectTypeField] as any[],
          x => x.schemaName == data.schemaName && x.pureName == data.pureName
        );
      });
    } else if (menu.isTruncate) {
      const { conid, database } = data;
      const driver = await getDriver();
      const dmp = driver.createDumper();
      dmp.truncateTable(data);

      const sql = dmp.s;

      showModal(ConfirmSqlModal, {
        sql,
        onConfirm: async () => {
          saveScriptToDatabase({ conid, database }, sql);
        },
        engine: driver.engine,
      });
    } else if (menu.isRename) {
      const { conid, database } = data;
      renameDatabaseObjectDialog(conid, database, data.pureName, (db, newName) => {
        const obj = db[data.objectTypeField].find(x => x.schemaName == data.schemaName && x.pureName == data.pureName);
        obj.pureName = newName;
      });
    } else if (menu.isDropCollection) {
      showModal(ConfirmModal, {
        message: translate('message.dropCollection', { values: { name: data.pureName } }),
        onConfirm: async () => {
          const dbid = _.pick(data, ['conid', 'database']);
          saveScriptToDatabase(dbid, `db.dropCollection('${data.pureName}')`);
        },
      });
    } else if (menu.isCopyTableName) {
      copyTextToClipboard(data.pureName);
    } else if (menu.isRenameCollection) {
      showModal(InputTextModal, {
        label: translate('modal.collection.label'),
        header: translate('modal.collection.renameHeader'),
        value: data.pureName,
        onConfirm: async newName => {
          const dbid = _.pick(data, ['conid', 'database']);
          await apiCall('database-connections/run-script', {
            ...dbid,
            sql: `db.renameCollection('${data.pureName}', '${newName}')`,
          });
          apiCall('database-connections/sync-model', dbid);
        },
      });
    } else if (menu.isDuplicateCollection) {
      const newName = `_${data.pureName}_${dateFormat(new Date(), 'yyyy-MM-dd-hh-mm-ss')}`;

      showModal(ConfirmModal, {
        message: translate(`message.createCopyCollection`, { values: { name: newName } }),
        onConfirm: async () => {
          const dbid = _.pick(data, ['conid', 'database']);
          saveScriptToDatabase(dbid, `db.collection('${data.pureName}').aggregate([{$out: '${newName}'}]).toArray()`);
        },
      });
    } else if (menu.isDuplicateTable) {
      const driver = await getDriver();
      const dmp = driver.createDumper();
      const newTable = _.cloneDeep(data);
      const { conid, database } = data;

      newTable.pureName = `_${newTable.pureName}_${dateFormat(new Date(), 'yyyy-MM-dd-hh-mm-ss')}`;
      newTable.columns.forEach(x => {
        x.autoIncrement = false;
        x.defaultConstraint = null;
      });
      newTable.foreignKeys = [];
      newTable.checks = [];
      newTable.uniques = [];
      newTable.indexes = [];
      if (newTable.primaryKey) {
        newTable.primaryKey.constraintName = null;
      }
      dmp.createTable(newTable);
      dmp.putCmd(
        '^insert ^into %f(%,i) ^select %,i from %f',
        newTable,
        newTable.columns.map(x => x.columnName),
        data.columns.map(x => x.columnName),
        data
      );

      showModal(ConfirmSqlModal, {
        sql: dmp.s,
        onConfirm: async () => {
          saveScriptToDatabase({ conid, database }, dmp.s);
        },
        engine: driver.engine,
      });
    } else if (menu.isImport) {
      const { conid, database } = data;
      showModal(ImportExportModal, {
        initialValues: {
          sourceStorageType: getDefaultFileFormat(getExtensions()).storageType,
          targetStorageType: 'database',
          targetConnectionId: conid,
          targetDatabaseName: database,
          fixedTargetPureName: data.pureName,
        },
      });
    } else {
      openDatabaseObjectDetail(
        menu.tab,
        menu.scriptTemplate,
        data,
        menu.forceNewTab,
        menu.initialData,
        menu.icon,
        data
      );
    }
  }

  function getObjectTitle(connection, schemaName, pureName) {
    const driver = findEngineDriver(connection, getExtensions());

    const defaultSchema = driver?.dialect?.defaultSchemaName;
    if (schemaName && defaultSchema && schemaName != defaultSchema) {
      return `${schemaName}.${pureName}`;
    }
    return pureName;
  }

  export async function openDatabaseObjectDetail(
    tabComponent,
    scriptTemplate,
    { schemaName, pureName, conid, database, objectTypeField },
    forceNewTab?,
    initialData?,
    icon?,
    appObjectData?
  ) {
    const connection = await getConnectionInfo({ conid });
    const tooltip = `${getConnectionLabel(connection)}\n${database}\n${fullDisplayName({
      schemaName,
      pureName,
    })}`;

    openNewTab(
      {
        title: scriptTemplate ? translate('tab.common.query') : getObjectTitle(connection, schemaName, pureName),
        tooltip,
        icon: icon || (scriptTemplate ? 'img sql-file' : databaseObjectIcons[objectTypeField]),
        tabComponent: scriptTemplate ? 'QueryTab' : tabComponent,
        appObject: 'DatabaseObjectAppObject',
        appObjectData,
        props: {
          schemaName,
          pureName,
          conid,
          database,
          objectTypeField,
          initialArgs: scriptTemplate ? { scriptTemplate } : null,
        },
      },
      initialData,
      { forceNewTab }
    );
  }

  export function handleDatabaseObjectClick(data, forceNewTab = false) {
    const { schemaName, pureName, conid, database, objectTypeField } = data;

    const configuredAction = getCurrentSettings()[`defaultAction.dbObjectClick.${objectTypeField}`];
    const overrideMenu = menus[objectTypeField].find(x => x.label && x.label == configuredAction);
    if (overrideMenu) {
      databaseObjectMenuClickHandler(data, overrideMenu);
      return;
    }

    openDatabaseObjectDetail(
      defaultTabs[objectTypeField],
      defaultTabs[objectTypeField] ? null : 'CREATE OBJECT',
      {
        schemaName,
        pureName,
        conid,
        database,
        objectTypeField,
      },
      forceNewTab,
      null,
      null,
      data
    );
  }

  function testEqual(a, b) {
    return (
      a.conid == b.conid &&
      a.database == b.database &&
      a.objectTypeField == b.objectTypeField &&
      a.pureName == b.pureName &&
      a.schemaName == b.schemaName
    );
  }

  export function createDatabaseObjectMenu(data, connection = null) {
    const { objectTypeField } = data;
    return menus[objectTypeField]
      .filter(x => x)
      .map(menu => {
        if (menu.divider) return menu;

        if (menu.isExport) {
          return createQuickExportMenu(
            fmt => async () => {
              const coninfo = await getConnectionInfo(data);
              exportQuickExportFile(
                data.pureName,
                {
                  functionName: menu.functionName,
                  props: {
                    connection: extractShellConnection(coninfo, data.database),
                    ..._.pick(data, ['pureName', 'schemaName']),
                  },
                },
                fmt
              );
            },
            {
              onClick: () => {
                // openNewTab(
                //   {
                //     tabComponent: 'ImportExportTab',
                //     title: 'Import/Export',
                //     icon: 'img export',
                //   },
                //   {
                //     editor: {
                //       sourceStorageType: 'database',
                //       sourceConnectionId: data.conid,
                //       sourceDatabaseName: data.database,
                //       sourceSchemaName: data.schemaName,
                //       sourceList: [data.pureName],
                //     },
                //   }
                // );
                showModal(ImportExportModal, {
                  initialValues: {
                    sourceStorageType: 'database',
                    sourceConnectionId: data.conid,
                    sourceDatabaseName: data.database,
                    sourceSchemaName: data.schemaName,
                    sourceList: [data.pureName],
                  },
                });
              },
            }
          );
        }

        if (connection?.isReadOnly && menu.requiresWriteAccess) {
          return null;
        }
        return {
          text: menu.label,
          onClick: () => {
            databaseObjectMenuClickHandler(data, menu);
          },
        };
      });
  }

  function formatRowCount(value) {
    const num = parseInt(value);
    if (_.isNaN(num)) return value;
    return num.toLocaleString();
  }

  export function createAppObjectMenu(data) {
    return createDatabaseObjectMenu(data);
  }
</script>

<script lang="ts">
  import _ from 'lodash';
  import AppObjectCore from './AppObjectCore.svelte';
  import {
    currentDatabase,
    // extensions,
    getCurrentSettings,
    getExtensions,
    // openedConnections,
    pinnedTables,
  } from '../stores';
  import openNewTab from '../utility/openNewTab';
  import { filterName } from 'dbgate-tools';
  import { getConnectionInfo } from '../utility/metadataLoaders';
  import fullDisplayName from '../utility/fullDisplayName';
  import ImportExportModal from '../modals/ImportExportModal.svelte';
  import { showModal } from '../modals/modalTools';
  import { findEngineDriver } from 'dbgate-tools';
  import uuidv1 from 'uuid/v1';
  import SqlGeneratorModal from '../modals/SqlGeneratorModal.svelte';
  import getConnectionLabel from '../utility/getConnectionLabel';
  import { exportQuickExportFile } from '../utility/exportFileTools';
  import createQuickExportMenu from '../utility/createQuickExportMenu';
  import ConfirmSqlModal, { saveScriptToDatabase } from '../modals/ConfirmSqlModal.svelte';
  import { alterDatabaseDialog, renameDatabaseObjectDialog } from '../utility/alterDatabaseTools';
  import ConfirmModal from '../modals/ConfirmModal.svelte';
  import { apiCall } from '../utility/api';
  import InputTextModal from '../modals/InputTextModal.svelte';
  import { extractShellConnection } from '../impexp/createImpExpScript';
  import { format as dateFormat } from 'date-fns';
  import { getDefaultFileFormat } from '../plugins/fileformats';

  export let data;
  export let passProps;

  function handleClick(forceNewTab = false) {
    handleDatabaseObjectClick(data, forceNewTab);
  }

  function createMenu() {
    const menus = createDatabaseObjectMenu(data, passProps?.connection);
    console.log('menus: ', $currentDatabase, menus);
    return menus;
  }

  $: isPinned = !!$pinnedTables.find(x => testEqual(data, x));
</script>

<AppObjectCore
  {...$$restProps}
  module={$$props.module}
  {data}
  title={data.schemaName ? `${data.schemaName}.${data.pureName}` : data.pureName}
  icon={databaseObjectIcons[data.objectTypeField]}
  menu={createMenu}
  showPinnedInsteadOfUnpin={passProps?.showPinnedInsteadOfUnpin}
  onPin={isPinned ? null : () => pinnedTables.update(list => [...list, data])}
  onUnpin={isPinned ? () => pinnedTables.update(list => list.filter(x => !testEqual(x, data))) : null}
  extInfo={data.tableRowCount != null ? `${formatRowCount(data.tableRowCount)} rows` : null}
  on:click={() => handleClick()}
  on:middleclick={() => handleClick(true)}
  on:expand
  on:dragstart
  on:dragenter
  on:dragend
  on:drop
/>
