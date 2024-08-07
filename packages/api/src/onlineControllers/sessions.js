const crypto = require('crypto');
const _ = require('lodash');
const connections = require('./connections');
const socket = require('../utility/socket');
const { fork } = require('child_process');
const jsldata = require('./jsldata');
const path = require('path');
const { handleProcessCommunication } = require('../utility/processComm');
const processArgs = require('../utility/processArgs');
const { appdir } = require('../utility/directories');
const { getLogger } = require('dbgate-tools');
const pipeForkLogs = require('../utility/pipeForkLogs');
const config = require('./config');
const axios = require('axios');
const { getRealIp } = require('../utility/utils');

const logger = getLogger('sessions');

module.exports = {
  /** @type {import('dbgate-types').OpenedSession[]} */
  opened: [],

  // handle_error(sesid, props) {
  //   const { error } = props;
  //   console.log(`Error in database session ${sesid}`, error);
  //   this.dispatchMessage(sesid, {
  //     severity: 'error',
  //     message: error && error.toString(),
  //   });
  // },

  // handle_row(sesid, props) {
  //   const { row } = props;
  //   socket.emit('sessionRow', row);
  // },
  getSession(jslid) {
    console.log('getSession: ', jslid, this.opened);
    const openItem = this.opened.find(item => item.loadingReader_jslid === jslid);
    return _.pick(openItem, ['conid', 'session']);
  },
  dispatchMessage(sesid, message) {
    if (_.isString(message)) {
      socket.emit(`session-info-${sesid}`, {
        message,
        time: new Date(),
        severity: 'info',
      });
    }
    if (_.isPlainObject(message)) {
      socket.emit(`session-info-${sesid}`, {
        time: new Date(),
        severity: 'info',
        ...message,
      });
    }
  },
  saveLog(params, req) {
    try {
      logger.info(params, 'save log params ');
      const auth = req.headers['x-authorization'] || '';
      const url = `${process.env.ONLINE_ADMIN_API}/system/databaseexcute/afterprocess`;
      axios.default.post(url, params, {
        headers: {
          authorization: `Bearer ${auth}`,
          'content-type': 'application/json',
        },
      });
    } catch (err) {
      logger.error({ err: err.message }, 'save log error.');
    }
  },
  handle_info(sesid, props) {
    console.log('handle_recordset: ', sesid, props);
    const { info } = props;
    this.dispatchMessage(sesid, info);
  },

  handle_done(sesid, props) {
    console.log('handle_done: ', sesid, props);
    socket.emit(`session-done-${sesid}`);
    if (!props.skipFinishedMessage) {
      this.dispatchMessage(sesid, 'Query execution finished');
    }
    const session = this.opened.find(x => x.sesid == sesid);
    if (session.loadingReader_jslid) {
      socket.emit(`session-jslid-done-${session.loadingReader_jslid}`);
    }
    if (session.killOnDone) {
      this.kill({ sesid });
    }
  },

  handle_recordset(sesid, props) {
    console.log('handle_recordset: ', sesid, props);
    const { jslid, resultIndex } = props;
    socket.emit(`session-recordset-${sesid}`, { jslid, resultIndex });
  },

  handle_stats(sesid, stats) {
    console.log('handle_stats: ', sesid, stats);
    const session = this.opened.find(x => x.sesid == sesid);
    console.log('stats: ', session);
    jsldata.notifyChangedStats({ ...stats, sesid });
  },

  handle_initializeFile(sesid, props) {
    console.log('handle_initializeFile: ', sesid, props);
    const { jslid } = props;
    socket.emit(`session-initialize-file-${jslid}`);
  },

  handle_ping() {},

  create_meta: true,
  async create({ conid, database }, req) {
    console.log('api package: ', global['API_PACKAGE'], process.argv[1]);
    const sesid = crypto.randomUUID();
    const connection = await connections.getCore({ conid });
    const subprocess = fork(
      global['API_PACKAGE'] || process.argv[1],
      [
        '--is-forked-api',
        '--start-process',
        'sessionProcess',
        ...processArgs.getPassArgs(),
        // ...process.argv.slice(3),
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      }
    );
    pipeForkLogs(subprocess);
    const newOpened = {
      conid,
      database,
      subprocess,
      connection,
      sesid,
      // srcIp: getRealIp(req),
    };
    this.opened.push(newOpened);
    subprocess.on('message', message => {
      // @ts-ignore
      const { msgtype } = message;
      if (handleProcessCommunication(message, subprocess)) return;
      if (msgtype) {
        this[`handle_${msgtype}`](sesid, message);
      }
    });
    subprocess.on('exit', () => {
      this.opened = this.opened.filter(x => x.sesid != sesid);
      this.dispatchMessage(sesid, 'Query session closed');
      socket.emit(`session-closed-${sesid}`);
    });

    subprocess.send({
      msgtype: 'connect',
      ...connection,
      database,
      globalSettings: await config.getSettings(),
    });
    return _.pick(newOpened, ['conid', 'database', 'sesid']);
  },
  saveLogs_meta: true,
  async saveLogs({ sesid, message, sql }, req) {
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }
    const srcIp = getRealIp(req);
    // coind: username_groupId_dbId_dbName
    const main = session.conid.split('_');
    this.saveLog(
      {
        userId: main[0],
        groupId: main[1],
        dataBaseId: main[2],
        dbName: session.database,
        srcIp: srcIp,
        tarIp: '',
        executeStat: message,
        responseSize: '',
        responseTime: '',
        effectedRows: '',
        executeTime: '',
        sqllang: sql,
        affectConts: '',
        connNum: '',
      },
      req
    );
    return { state: 'ok' };
  },

  executeQuery_meta: true,
  async executeQuery({ sesid, sql }, req) {
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }
    // const srcIp = req.clientIp;
    const srcIp = getRealIp(req);
    // coind: username_groupId_dbId_dbName
    const main = session.conid.split('_');
    try {
      const params = {
        userId: main[0],
        groupId: main[1],
        dataBaseId: main[2],
        dbName: session.database,
        srcIp: srcIp,
        sql,
      };
      console.log('verifysql params: ', params);
      const auth = req.headers['x-authorization'] || '';
      // console.log('verifysql token: ', auth);
      const url = `${process.env.ONLINE_ADMIN_API}/system/databaseexcute/verifysql`;
      const response = await axios.default.post(url, params, {
        headers: {
          authorization: `Bearer ${auth}`,
          'content-type': 'application/json',
        },
      });
      const respdata = response.data;
      console.log('verifysql result: ', respdata);
      if (respdata.code !== 200) {
        throw new Error(respdata.msg);
      }
    } catch (err) {
      this.dispatchMessage(sesid, err.message);

      this.saveLog(
        {
          userId: main[0],
          groupId: main[1],
          dataBaseId: main[2],
          dbName: session.database,
          srcIp: srcIp,
          tarIp: '',
          executeStat: err.message,
          responseSize: '',
          responseTime: '',
          effectedRows: '',
          executeTime: '',
          sqllang: sql,
          affectConts: '',
          connNum: '',
        },
        req
      );
      session.subprocess.kill();
      this.dispatchMessage(sesid, 'Connection closed');
      return { state: 'error' };
    }

    logger.info({ sesid, sql }, 'Processing query');
    this.dispatchMessage(sesid, 'Query execution started');
    session.subprocess.send({
      msgtype: 'executeQuery',
      sql,
      sesid,
    });

    return { state: 'ok' };
  },

  executeReader_meta: true,
  async executeReader({ conid, database, sql, queryName, appFolder }) {
    const { sesid } = await this.create({ conid, database });
    const session = this.opened.find(x => x.sesid == sesid);
    session.killOnDone = true;
    const jslid = crypto.randomUUID();
    session.loadingReader_jslid = jslid;
    const fileName = queryName && appFolder ? path.join(appdir(), appFolder, `${queryName}.query.sql`) : null;

    session.subprocess.send({ msgtype: 'executeReader', sql, fileName, jslid });

    return { jslid };
  },

  stopLoadingReader_meta: true,
  async stopLoadingReader({ jslid }) {
    const session = this.opened.find(x => x.loadingReader_jslid == jslid);
    if (session) {
      this.kill({ sesid: session.sesid });
    }
    return true;
  },

  startProfiler_meta: true,
  async startProfiler({ sesid }) {
    const jslid = crypto.randomUUID();
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }

    logger.info({ sesid }, 'Starting profiler');
    session.loadingReader_jslid = jslid;
    session.subprocess.send({ msgtype: 'startProfiler', jslid });

    return { state: 'ok', jslid };
  },

  stopProfiler_meta: true,
  async stopProfiler({ sesid }) {
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }
    session.subprocess.send({ msgtype: 'stopProfiler' });
    return { state: 'ok' };
  },

  // cancel_meta: true,
  // async cancel({ sesid }) {
  //   const session = this.opened.find((x) => x.sesid == sesid);
  //   if (!session) {
  //     throw new Error('Invalid session');
  //   }
  //   session.subprocess.send({ msgtype: 'cancel' });
  //   return { state: 'ok' };
  // },

  kill_meta: true,
  async kill({ sesid }) {
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }
    session.subprocess.kill();
    this.dispatchMessage(sesid, 'Connection closed');
    return { state: 'ok' };
  },

  ping_meta: true,
  async ping({ sesid }) {
    const session = this.opened.find(x => x.sesid == sesid);
    if (!session) {
      throw new Error('Invalid session');
    }
    try {
      session.subprocess.send({ msgtype: 'ping' });
    } catch (err) {
      logger.error({ err }, 'Error pinging session');

      return {
        status: 'error',
        message: 'Ping failed',
      };
    }

    return { state: 'ok' };
  },

  // runCommand_meta: true,
  // async runCommand({ conid, database, sql }) {
  //   console.log(`Running SQL command , conid=${conid}, database=${database}, sql=${sql}`);
  //   const opened = await this.ensureOpened(conid, database);
  //   const res = await this.sendRequest(opened, { msgtype: 'queryData', sql });
  //   return res;
  // },
};
