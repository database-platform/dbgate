const connections = require('./connections');
const socket = require('../utility/socket');
const { fork } = require('child_process');
const _ = require('lodash');
const AsyncLock = require('async-lock');
const { handleProcessCommunication } = require('../utility/processComm');
const lock = new AsyncLock();
const config = require('./config');
const processArgs = require('../utility/processArgs');
// const { testConnectionPermission } = require('../utility/hasPermission');
const { MissingCredentialsError } = require('../utility/exceptions');
const pipeForkLogs = require('../utility/pipeForkLogs');
const PermissionService = require('../db/services/permissionService');
const redisClient = require('../db/redis');
const { getLogger } = require('dbgate-tools');

const logger = getLogger('serverConnection');

const permissionService = new PermissionService();
module.exports = {
  opened: [],
  closed: {},
  lastPinged: {},
  requests: {},

  handle_databases(conid, { databases }) {
    const existing = this.opened.find(x => x.conid == conid);
    if (!existing) return;
    existing.databases = databases;
    socket.emitChanged(`database-list-changed`, { conid });
  },
  handle_version(conid, { version }) {
    const existing = this.opened.find(x => x.conid == conid);
    if (!existing) return;
    existing.version = version;
    socket.emitChanged(`server-version-changed`, { conid });
  },
  handle_status(conid, { status }) {
    const existing = this.opened.find(x => x.conid == conid);
    if (!existing) return;
    existing.status = status;
    socket.emitChanged(`server-status-changed`);
  },
  handle_ping() {},
  handle_response(conid, { msgid, ...response }) {
    const [resolve, reject] = this.requests[msgid];
    resolve(response);
    delete this.requests[msgid];
  },

  async ensureOpened(conid) {
    const res = await lock.acquire(conid, async () => {
      const existing = this.opened.find(x => x.conid == conid);
      if (existing) return existing;
      const connection = await connections.getCore({ conid });
      if (!connection) {
        throw new Error(`Connection with conid="${conid}" not fund`);
      }
      if (connection.passwordMode == 'askPassword' || connection.passwordMode == 'askUser') {
        throw new MissingCredentialsError({ conid, passwordMode: connection.passwordMode });
      }
      let processStr = 'serverConnectionProcess';
      // if (connection.trinoFlag) {
      //   processStr = 'trinoServerConnectionProcess';
      // } else {
      //   processStr = 'serverConnectionProcess';
      // }
      const subprocess = fork(
        global['API_PACKAGE'] || process.argv[1],
        [
          '--is-forked-api',
          '--start-process',
          processStr,
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
        subprocess,
        databases: [],
        connection,
        status: {
          name: 'pending',
        },
        disconnected: false,
      };
      this.opened.push(newOpened);
      delete this.closed[conid];
      socket.emitChanged(`server-status-changed`);
      subprocess.on('message', message => {
        // @ts-ignore
        const { msgtype } = message;
        if (handleProcessCommunication(message, subprocess)) return;
        if (newOpened.disconnected) return;
        if (msgtype) {
          // logger.info({ message }, 'message');
          this[`handle_${msgtype}`](conid, message);
        }
      });
      subprocess.on('exit', () => {
        if (newOpened.disconnected) return;
        this.close(conid, false);
      });
      subprocess.send({ msgtype: 'connect', ...connection, globalSettings: await config.getSettings() });
      return newOpened;
    });
    return res;
  },

  close(conid, kill = true) {
    const existing = this.opened.find(x => x.conid == conid);
    if (existing) {
      existing.disconnected = true;
      if (kill) {
        try {
          existing.subprocess.kill();
        } catch (err) {
          logger.error({ err }, 'Error killing subprocess');
        }
      }
      this.opened = this.opened.filter(x => x.conid != conid);
      this.closed[conid] = {
        ...existing.status,
        name: 'error',
      };
      socket.emitChanged(`server-status-changed`);
    }
  },

  disconnect_meta: true,
  async disconnect({ conid }, req) {
    // testConnectionPermission(conid, req);
    await this.close(conid, true);
    return { status: 'ok' };
  },

  disconnectManager_meta: true,
  async disconnectManager({ conid }, req) {
    // testConnectionPermission(conid, req);
    await this.close(`${conid}:manager`, true);
    return { status: 'ok' };
  },

  listDatabasesManager_meta: true,
  async listDatabasesManager({ conid }, req) {
    if (!conid) return [];
    // testConnectionPermission(conid, req);
    const conids = conid.split('_');
    const opened = await this.ensureOpened(`${conid}:manager`);
    if (opened.databases && opened.databases.length != 0) {
      const permissions = await permissionService.findDatbase(conids[1], conids[2]);
      console.log('list all permissions ', permissions.length);
      opened.databases?.map(db => {
        const permission = permissions.find(p => p.schema === db.name);
        if (permission) {
          db.permission = permission;
        } else {
          db.permission = null;
        }
      });
    }
    return opened.databases;
  },

  listDatabases_meta: true,
  async listDatabases({ conid }, req) {
    if (!conid) return [];
    // testConnectionPermission(conid, req);
    const conids = conid.split('_');
    const opened = await this.ensureOpened(conid);
    if (opened.databases && opened.databases.length != 0) {
      const permissions = await permissionService.findDatbase(conids[1], conids[2]);
      console.log('permissions ', permissions.length);
      opened.databases = opened.databases?.filter(db => {
        const permission = permissions.find(p => p.schema === db.name);
        if (permission) {
          if (permission.hidden === 1) {
            return false;
          }
          if (permission.dql === 0 && permission.dml === 0 && permission.dcl === 0 && permission.ddl === 0) {
            return false;
          }
          db.permission = permission;
          return true;
        }
        return false;
      });
      //   opened.databases?.map(db => {
      //     const permission = permissions.find(p => p.schema === db.name);
      //     if (permission) {
      //       db.permission = permission;
      //     } else {
      //       db.permission = null;
      //     }
      //   });
    }
    return opened.databases;
  },

  version_meta: true,
  async version({ conid }, req) {
    // testConnectionPermission(conid, req);
    const opened = await this.ensureOpened(conid);
    return opened.version;
  },

  serverStatus_meta: true,
  async serverStatus({ conid }) {
    if (conid) {
      return {
        ...this.closed[conid],
        ..._.mapValues(
          _.keyBy(
            this.opened.filter(item => item.conid === conid),
            'conid'
          ),
          'status'
        ),
      };
    }
    return {
      ...this.closed,
      ..._.mapValues(_.keyBy(this.opened, 'conid'), 'status'),
    };
  },

  ping_meta: true,
  async ping({ conidArray, strmid }) {
    await Promise.all(
      _.uniq(conidArray).map(async conid => {
        const last = this.lastPinged[conid];
        if (last && new Date().getTime() - last < 30 * 1000) {
          return Promise.resolve();
        }
        this.lastPinged[conid] = new Date().getTime();
        const opened = await this.ensureOpened(conid);
        try {
          opened.subprocess.send({ msgtype: 'ping' });
        } catch (err) {
          logger.error({ err }, 'Error pinging server connection');
          this.close(conid);
        }
      })
    );
    socket.setStreamIdFilter(strmid, { conid: conidArray });
    return { status: 'ok' };
  },

  refresh_meta: true,
  async refresh({ conid, keepOpen }, req) {
    // testConnectionPermission(conid, req);
    // console.log('server connections: ', this.opened, this.closed, this.requests, this.lastPinged);
    if (!keepOpen) this.close(conid);

    await this.ensureOpened(conid);
    return { status: 'ok' };
  },

  createDatabase_meta: true,
  async createDatabase({ conid, name }, req) {
    // testConnectionPermission(conid, req);
    const opened = await this.ensureOpened(conid);
    if (opened.connection.isReadOnly) return false;
    opened.subprocess.send({ msgtype: 'createDatabase', name });
    return { status: 'ok' };
  },

  dropDatabase_meta: true,
  async dropDatabase({ conid, name }, req) {
    // testConnectionPermission(conid, req);
    const opened = await this.ensureOpened(conid);
    if (opened.connection.isReadOnly) return false;
    opened.subprocess.send({ msgtype: 'dropDatabase', name });
    return { status: 'ok' };
  },

  sendRequest(conn, message) {
    const msgid = crypto.randomUUID();
    const promise = new Promise((resolve, reject) => {
      this.requests[msgid] = [resolve, reject];
      try {
        conn.subprocess.send({ msgid, ...message });
      } catch (err) {
        logger.error({ err }, 'Error sending request');
        this.close(conn.conid);
      }
    });
    return promise;
  },

  async loadDataCore(msgtype, { conid, ...args }, req) {
    // testConnectionPermission(conid, req);
    const opened = await this.ensureOpened(conid);
    const res = await this.sendRequest(opened, { msgtype, ...args });
    if (res.errorMessage) {
      console.error(res.errorMessage);

      return {
        errorMessage: res.errorMessage,
      };
    }
    return res.result || null;
  },

  serverSummary_meta: true,
  async serverSummary({ conid }, req) {
    // testConnectionPermission(conid, req);
    return this.loadDataCore('serverSummary', { conid });
  },

  summaryCommand_meta: true,
  async summaryCommand({ conid, command, row }, req) {
    // testConnectionPermission(conid, req);
    const opened = await this.ensureOpened(conid);
    if (opened.connection.isReadOnly) return false;
    return this.loadDataCore('summaryCommand', { conid, command, row });
  },

  getOpenedConnectionReport() {
    return this.opened.map(con => ({
      status: con.status,
      versionText: con.version?.versionText,
      databaseCount: con.databases.length,
      connection: _.pick(con.connection, [
        'engine',
        'useSshTunnel',
        'authType',
        'trustServerCertificate',
        'useSsl',
        'sshMode',
      ]),
    }));
  },
};
