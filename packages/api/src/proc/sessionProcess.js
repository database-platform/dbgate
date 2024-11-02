const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const childProcessChecker = require('../utility/childProcessChecker');
const { splitQuery } = require('dbgate-query-splitter');
const { Parser } = require('node-sql-parser');
const { jsldir } = require('../utility/directories');
const requireEngineDriver = require('../utility/requireEngineDriver');
// const { decryptConnection } = require('../utility/crypting');
const connectUtility = require('../utility/connectUtility');
const { handleProcessCommunication } = require('../utility/processComm');
const { makeUniqueColumnNames, getLogger, extractIntSettingsValue, extractBoolSettingsValue } = require('dbgate-tools');
const PermissionService = require('../db/services/permissionService');
const { processMask, dataMask } = require('../utility/dataMask');

const permissionService = new PermissionService();
const logger = getLogger('sessionProcess');
const parser = new Parser();

let systemConnection;
let storedConnection;
let afterConnectCallbacks = [];
// let currentHandlers = [];
let lastPing = null;
let lastActivity = null;
let currentProfiler = null;
let executingScripts = 0;

class TableWriter {
  constructor() {
    this.currentRowCount = 0;
    this.currentChangeIndex = 1;
    this.initializedFile = false;
  }

  initializeFromQuery(structure, resultIndex) {
    this.jslid = crypto.randomUUID();
    this.currentFile = path.join(jsldir(), `${this.jslid}.jsonl`);
    fs.writeFileSync(
      this.currentFile,
      JSON.stringify({
        ...structure,
        __isStreamHeader: true,
      }) + '\n'
    );
    this.currentStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
    this.writeCurrentStats(false, false);
    this.resultIndex = resultIndex;
    this.initializedFile = true;
    process.send({ msgtype: 'recordset', jslid: this.jslid, resultIndex });
  }

  initializeFromReader(jslid) {
    this.jslid = jslid;
    this.currentFile = path.join(jsldir(), `${this.jslid}.jsonl`);
    this.writeCurrentStats(false, false);
  }

  row(row) {
    // console.log('ACCEPT ROW', row);
    this.currentStream.write(JSON.stringify(row) + '\n');
    this.currentRowCount += 1;

    if (!this.plannedStats) {
      this.plannedStats = true;
      process.nextTick(() => {
        if (this.currentStream) this.currentStream.uncork();
        process.nextTick(() => this.writeCurrentStats(false, true));
        this.plannedStats = false;
      });
    }
  }

  rowFromReader(row) {
    if (!this.initializedFile) {
      process.send({ msgtype: 'initializeFile', jslid: this.jslid });
      this.initializedFile = true;

      fs.writeFileSync(this.currentFile, JSON.stringify(row) + '\n');
      this.currentStream = fs.createWriteStream(this.currentFile, { flags: 'a' });
      this.writeCurrentStats(false, false);
      this.initializedFile = true;
      return;
    }

    this.row(row);
  }

  writeCurrentStats(isFinished = false, emitEvent = false) {
    const stats = {
      rowCount: this.currentRowCount,
      changeIndex: this.currentChangeIndex,
      isFinished,
      jslid: this.jslid,
    };
    fs.writeFileSync(`${this.currentFile}.stats`, JSON.stringify(stats));
    this.currentChangeIndex += 1;
    if (emitEvent) {
      process.send({ msgtype: 'stats', ...stats });
    }
  }

  close(afterClose) {
    if (this.currentStream) {
      this.currentStream.end(() => {
        this.writeCurrentStats(true, true);
        if (afterClose) afterClose();
      });
    }
  }
}

class StreamHandler {
  constructor(resultIndexHolder, resolve, startLine, unionColumns) {
    this.recordset = this.recordset.bind(this);
    this.startLine = startLine;
    this.row = this.row.bind(this);
    // this.error = this.error.bind(this);
    this.done = this.done.bind(this);
    this.info = this.info.bind(this);

    // use this for cancelling - not implemented
    // this.stream = null;

    this.plannedStats = false;
    this.resultIndexHolder = resultIndexHolder;
    this.resolve = resolve;
    // currentHandlers = [...currentHandlers, this];
    this.unionColumns = unionColumns;
  }

  closeCurrentWriter() {
    if (this.currentWriter) {
      this.currentWriter.close();
      this.currentWriter = null;
    }
  }

  recordset(columns) {
    this.closeCurrentWriter();
    this.currentWriter = new TableWriter();
    this.currentWriter.initializeFromQuery(
      Array.isArray(columns) ? { columns } : columns,
      this.resultIndexHolder.value
    );
    this.resultIndexHolder.value += 1;

    // this.writeCurrentStats();

    // this.onRow = _.throttle((jslid) => {
    //   if (jslid == this.jslid) {
    //     this.writeCurrentStats(false, true);
    //   }
    // }, 500);
  }
  row(row) {
    if (this.currentWriter) {
      try {
        this.unionColumns.map(col => {
          if (col.authMask) {
            const colName = col.as ?? col.columnName;
            row[colName] = dataMask(row[colName], col.authMask);
          }
        });
        this.currentWriter.row(row);
      } catch (error) {
        process.send({ msgtype: 'info', info: { message: error.message } });
      }
    } else if (row.message) {
      process.send({ msgtype: 'info', info: { message: row.message } });
    }
    // this.onRow(this.jslid);
  }
  // error(error) {
  //   process.send({ msgtype: 'error', error });
  // }
  done(result) {
    this.closeCurrentWriter();
    // currentHandlers = currentHandlers.filter((x) => x != this);
    this.resolve();
  }
  info(info) {
    if (info && info.line != null) {
      info = {
        ...info,
        line: this.startLine + info.line,
      };
    }
    process.send({ msgtype: 'info', info });
  }
}

function handleStream(driver, resultIndexHolder, sqlItem, unionColumns) {
  return new Promise((resolve, reject) => {
    const start = sqlItem.trimStart || sqlItem.start;
    const handler = new StreamHandler(resultIndexHolder, resolve, start && start.line, unionColumns);
    driver.stream(systemConnection, sqlItem.text, handler);
  });
}

function allowExecuteCustomScript(driver) {
  if (driver.readOnlySessions) {
    return true;
  }
  if (storedConnection.isReadOnly) {
    return false;
    // throw new Error('Connection is read only');
  }
  return true;
}

async function handleConnect(connection) {
  storedConnection = connection;

  const driver = requireEngineDriver(storedConnection);
  systemConnection = await connectUtility(driver, storedConnection, 'app');
  for (const [resolve] of afterConnectCallbacks) {
    resolve();
  }
  afterConnectCallbacks = [];
}

// function handleCancel() {
//   for (const handler of currentHandlers) {
//     if (handler.stream) handler.stream.cancel();
//   }
// }

function waitConnected() {
  if (systemConnection) return Promise.resolve();
  return new Promise((resolve, reject) => {
    afterConnectCallbacks.push([resolve, reject]);
  });
}

async function handleStartProfiler({ jslid }) {
  lastActivity = new Date().getTime();

  await waitConnected();
  const driver = requireEngineDriver(storedConnection);

  if (!allowExecuteCustomScript(driver)) {
    process.send({ msgtype: 'done' });
    return;
  }

  const writer = new TableWriter();
  writer.initializeFromReader(jslid);

  currentProfiler = await driver.startProfiler(systemConnection, {
    row: data => writer.rowFromReader(data),
  });
  currentProfiler.writer = writer;
}

async function handleStopProfiler({ jslid }) {
  lastActivity = new Date().getTime();

  const driver = requireEngineDriver(storedConnection);
  currentProfiler.writer.close();
  driver.stopProfiler(systemConnection, currentProfiler);
  currentProfiler = null;
}

async function handleExecuteQuery({ sql }) {
  lastActivity = new Date().getTime();
  await waitConnected();
  const driver = requireEngineDriver(storedConnection);

  if (!allowExecuteCustomScript(driver)) {
    process.send({
      msgtype: 'info',
      info: {
        message: 'Connection without read-only sessions is read only',
        severity: 'error',
      },
    });
    process.send({ msgtype: 'done', skipFinishedMessage: true });
    return;
    //process.send({ msgtype: 'error', error: e.message });
  }

  executingScripts++;
  try {
    const resultIndexHolder = {
      value: 0,
    };
    for (const sqlItem of splitQuery(sql, {
      ...driver.getQuerySplitterOptions('stream'),
      returnRichInfo: true,
    })) {
      let unionColumns;
      // @ts-ignore
      if (sqlItem.text.trim().toLowerCase().startsWith('select')) {
        // @ts-ignore
        unionColumns = await getColumnsFromSql(sqlItem.text, driver);
        await dataMaskProcess(unionColumns);
        logger.debug({ unionColumns }, 'handleExecuteQuery columns: ');
      }
      await handleStream(driver, resultIndexHolder, sqlItem, unionColumns);
      // const handler = new StreamHandler(resultIndex);
      // const stream = await driver.stream(systemConnection, sqlItem, handler);
      // handler.stream = stream;
      // resultIndex = handler.resultIndex;
    }
    process.send({ msgtype: 'done' });
  } finally {
    executingScripts--;
  }
}

async function dataMaskProcess(columns) {
  const { groupId, originId, database } = storedConnection;
  const pureNames = _.chain(columns).groupBy('pureName').keys().value();
  logger.debug(`pureNames: ${pureNames}`);

  const globalDesenses = await permissionService.findDesenScan(originId, database, pureNames);
  logger.debug({ globalDesenses: globalDesenses?.length }, 'global desenses: ');
  const permissionDesenses = await permissionService.findColumnDataMask(groupId, originId, database, pureNames);
  logger.debug({ permissionDesenses: permissionDesenses?.length }, 'permission desenses: ');

  columns.map(col => {
    let gDesense = null;
    let pDesense = null;
    if (globalDesenses) {
      gDesense = globalDesenses.find(item => item.table_name === col.pureName && item.col_name === col.columnName);
    }
    if (permissionDesenses) {
      pDesense = permissionDesenses.find(item => item.tname === col.pureName && item.tcolumn === col.columnName);
      if (pDesense) {
        pDesense = pDesense.AuthMask;
      }
    }
    // The desensitization in the permission overrides the auto-scan desensitization
    if (gDesense || pDesense) {
      col.authMask = pDesense || gDesense;
    }
  });
  makeUniqueColumnNames(columns);
}

// select * from CITY
// ast: {
//      "with": null,
//      "type": "select",
//      "options": null,
//      "distinct": null,
//      "columns": [
//        {
//          "expr": {
//            "type": "column_ref",
//            "table": null,
//            "column": "*"
//          },
//          "as": null
//        }
//      ],
//      "into": {
//        "position": null
//      },
//      "from": [
//        {
//          "db": null,
//          "table": "CITY",
//          "as": null
//        }
//      ],
//      "where": null,
//      "groupby": null,
//      "having": null,
//      "orderby": null,
//      "limit": null,
//      "locking_read": null,
//      "window": null,
//      "collate": null
//    }
async function getColumnsFromSql(sql, driver) {
  let columns = [];
  try {
    const ast = parser.astify(sql);
    // logger.debug({ storedConnection }, 'getColumnsFromSql driver: ');
    //@ts-ignore
    const pColumns = ast.columns;
    //@ts-ignore
    const pFrom = ast.from;
    logger.debug({ pColumns, pFrom }, 'getColumnsFromSql parser: ');
    const star = pColumns.find(item => item.expr.column === '*');
    if (star) {
      columns = await getColumnsFromDB(pFrom, driver);
    } else {
      columns = getColumnsFromAst(pColumns, pFrom);
    }
    logger.debug({ columns }, 'getColumnsFromSql columns: ');
  } catch (error) {
    logger.error({ error }, 'getColumnsFromSql error: ');
  }
  return columns;
}

function getColumnsFromAst(columns, from) {
  return columns?.map(item => {
    const { type, column, value } = item.expr;
    let columnName = column;
    if (type === 'double_quote_string' || type === 'single_quote_string') {
      columnName = value;
    }
    return {
      columnName,
      as: item.as,
      pureName: getTableByAs(from, item.expr.table),
    };
  });
}

// column: { expr: { type: 'column_ref', table: 't', column: 'age' }, as: null }
// from: { db: null, table: 'EMPLOYEES', as: 'e' },
function getTableByAs(from, as) {
  const find = from.find(item => item.as === as);
  return find ? find.table : from[0].table;
}

/**
 * return: [{ pureName: 'xx', columnName: 'xxx' }]
 * */
async function getColumnsFromDB(from, driver) {
  const inCondition = from.map(item => `'${item.table}'`).join(', ');
  return await driver.tabColumns(systemConnection, inCondition);
}

async function handleExecuteReader({ jslid, sql, fileName }) {
  lastActivity = new Date().getTime();

  await waitConnected();

  const driver = requireEngineDriver(storedConnection);

  if (fileName) {
    sql = fs.readFileSync(fileName, 'utf-8');
  } else {
    if (!allowExecuteCustomScript(driver)) {
      process.send({ msgtype: 'done' });
      return;
    }
  }

  const writer = new TableWriter();
  writer.initializeFromReader(jslid);

  const reader = await driver.readQuery(systemConnection, sql);

  reader.on('data', data => {
    writer.rowFromReader(data);
  });
  reader.on('end', () => {
    writer.close(() => {
      process.send({ msgtype: 'done' });
    });
  });
}

function handlePing() {
  lastPing = new Date().getTime();
}

const messageHandlers = {
  connect: handleConnect,
  executeQuery: handleExecuteQuery,
  executeReader: handleExecuteReader,
  startProfiler: handleStartProfiler,
  stopProfiler: handleStopProfiler,
  ping: handlePing,
  // cancel: handleCancel,
};

async function handleMessage({ msgtype, ...other }) {
  const handler = messageHandlers[msgtype];
  await handler(other);
}

function start() {
  childProcessChecker();

  lastPing = new Date().getTime();

  setInterval(() => {
    const time = new Date().getTime();
    if (time - lastPing > 25 * 1000) {
      logger.info('Session not alive, exiting');
      process.exit(0);
    }

    const useSessionTimeout =
      storedConnection && storedConnection.globalSettings
        ? extractBoolSettingsValue(storedConnection.globalSettings, 'session.autoClose', true)
        : false;
    const sessionTimeout =
      storedConnection && storedConnection.globalSettings
        ? extractIntSettingsValue(storedConnection.globalSettings, 'session.autoCloseTimeout', 15, 1, 120)
        : 15;
    if (
      useSessionTimeout &&
      time - lastActivity > sessionTimeout * 60 * 1000 &&
      !currentProfiler &&
      executingScripts == 0
    ) {
      logger.info('Session not active, exiting');
      process.exit(0);
    }
  }, 10 * 1000);

  process.on('message', async message => {
    if (handleProcessCommunication(message)) return;
    try {
      await handleMessage(message);
    } catch (e) {
      process.send({
        msgtype: 'info',
        info: {
          message: e.message,
          severity: 'error',
        },
      });
      //process.send({ msgtype: 'error', error: e.message });
    }
  });
}

module.exports = { start };
