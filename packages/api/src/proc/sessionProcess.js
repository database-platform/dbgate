const engines = require('@dbgate/engines');
const uuidv1 = require('uuid/v1');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const driverConnect = require('../utility/driverConnect');
const { jsldir } = require('../utility/directories');

let systemConnection;
let storedConnection;
let afterConnectCallbacks = [];
let currentHandlers = [];

class StreamHandler {
  constructor() {
    this.recordset = this.recordset.bind(this);
    this.row = this.row.bind(this);
    // this.error = this.error.bind(this);
    this.done = this.done.bind(this);
    this.info = this.info.bind(this);
    // use this for cancelling
    this.stream = null;
    currentHandlers = [...currentHandlers, this];
  }

  closeCurrentStream() {
    if (this.currentStream) {
      this.currentStream.end();
      this.writeCurrentStats(true, true);

      this.currentStream = null;
      this.jslid = null;
      this.currentFile = null;
      this.currentRowCount = null;
      this.currentChangeIndex = null;
    }
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

  recordset(columns) {
    this.closeCurrentStream();
    this.jslid = uuidv1();
    this.currentFile = path.join(jsldir(), `${this.jslid}.jsonl`);
    this.currentStream = fs.createWriteStream(this.currentFile);
    this.currentRowCount = 0;
    this.currentChangeIndex = 0;
    fs.writeFileSync(`${this.currentFile}.info`, JSON.stringify(columns));
    process.send({ msgtype: 'recordset', jslid: this.jslid });
    this.writeCurrentStats();

    this.onRow = _.throttle((jslid) => {
      if (jslid == this.jslid) {
        this.writeCurrentStats(false, true);
      }
    }, 500);
  }
  row(row) {
    // console.log('ACCEPT ROW', row);
    this.currentStream.write(JSON.stringify(row) + '\n');
    this.currentRowCount += 1;
    this.onRow(this.jslid);
  }
  // error(error) {
  //   process.send({ msgtype: 'error', error });
  // }
  done(result) {
    this.closeCurrentStream();
    process.send({ msgtype: 'done', result });
    currentHandlers = currentHandlers.filter((x) => x != this);
  }
  info(info) {
    process.send({ msgtype: 'info', info });
  }
}

async function handleConnect(connection) {
  storedConnection = connection;

  const driver = engines(storedConnection);
  systemConnection = await driverConnect(driver, storedConnection);
  for (const [resolve] of afterConnectCallbacks) {
    resolve();
  }
  afterConnectCallbacks = [];
}

function handleCancel() {
  for (const handler of currentHandlers) {
    if (handler.stream) handler.stream.cancel();
  }
}

function waitConnected() {
  if (systemConnection) return Promise.resolve();
  return new Promise((resolve, reject) => {
    afterConnectCallbacks.push([resolve, reject]);
  });
}

async function handleExecuteQuery({ sql }) {
  await waitConnected();
  const driver = engines(storedConnection);

  const handler = new StreamHandler();
  const stream = await driver.stream(systemConnection, sql, handler);
  handler.stream = stream;
}

const messageHandlers = {
  connect: handleConnect,
  executeQuery: handleExecuteQuery,
  cancel: handleCancel,
};

async function handleMessage({ msgtype, ...other }) {
  const handler = messageHandlers[msgtype];
  await handler(other);
}

function start() {
  process.on('message', async (message) => {
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
