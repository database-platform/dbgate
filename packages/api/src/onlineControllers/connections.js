const path = require('path');
const { fork } = require('child_process');
const fs = require('fs-extra');
const crypto = require('crypto');

const { datadir, filesdir } = require('../utility/directories');
// const socket = require('../utility/socket');
// const { encryptConnection, maskConnection } = require('../utility/crypting');
const { handleProcessCommunication } = require('../utility/processComm');

// const JsonLinesDatabase = require('../utility/JsonLinesDatabase');
const OnlineDatabase = require('../db/services/databaseService');
const processArgs = require('../utility/processArgs');
const { safeJsonParse, getLogger } = require('dbgate-tools');
// const platformInfo = require('../utility/platformInfo');
const { connectionHasPermission, testConnectionPermission } = require('../utility/hasPermission');
const pipeForkLogs = require('../utility/pipeForkLogs');
// const axios = require('axios');

const logger = getLogger('connections');

// function generateFixedId(id, username, groupId) {
//   const combinedStr = `${id}:${username}:${groupId}`;
//   const hash = crypto.createHash('sha256');
//   hash.update(combinedStr);
//   const fixedId = hash.digest('hex');
//   logger.info({ combinedStr, fixedId }, 'generateFixedId');
//   return fixedId;
// }

let volatileConnections = {};

// const portalConnections = null;

// const singleDbConnection = null;
// const singleConnection = null;

module.exports = {
  datastore: null,
  // opened: [],
  // singleDbConnection,
  // singleConnection,
  // portalConnections,

  async _init() {
    logger.info('Multi user connections init.');
    // const dir = datadir();
    // if (!portalConnections) {
    // @ts-ignore
    // this.datastore = new JsonLinesDatabase(path.join(dir, 'connections.jsonl'));
    // }
    this.datastore = new OnlineDatabase();
  },
  listManager_meta: true,
  async listManager(_params) {
    let databases = [];
    try {
      databases = await this.datastore.find(_params.username, _params.groupId, null, _params.orgGroupId);
      // console.log('listManager databases ', databases);
    } catch (err) {
      logger.error({ err }, 'Error list connections.');
      return {
        apiErrorMessage: err.message,
      };
    }
    return databases;
  },

  group_meta: true,
  async group() {
    let groups = [];
    try {
      groups = await this.datastore.findOrgGroup();
    } catch (err) {
      logger.error({ err }, 'Error connection groups.');
      return {
        apiErrorMessage: err.message,
      };
    }
    return groups;
  },

  list_meta: true,
  async list(_params, req) {
    let databases = [];
    try {
      let auth = req.auth;
      const dataBaseUserGroup = await this.datastore.findDataBaseUserGroup(auth.username);
      if (!dataBaseUserGroup) {
        return databases;
      }
      if (!dataBaseUserGroup.group) {
        return databases;
      }
      databases = await this.datastore.find(auth.username, dataBaseUserGroup.group.groupId);
      logger.info(`list databases: ${databases?.length}`);
    } catch (err) {
      logger.error({ err }, 'Error list connections.');
      return {
        apiErrorMessage: err.message,
      };
    }
    return databases;
  },

  test_meta: true,
  test(connection) {
    const subprocess = fork(
      global['API_PACKAGE'] || process.argv[1],
      [
        '--is-forked-api',
        '--start-process',
        'connectProcess',
        ...processArgs.getPassArgs(),
        // ...process.argv.slice(3),
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      }
    );
    pipeForkLogs(subprocess);
    subprocess.send(connection);
    return new Promise(resolve => {
      subprocess.on('message', resp => {
        if (handleProcessCommunication(resp, subprocess)) return;
        // @ts-ignore
        const { msgtype } = resp;
        if (msgtype == 'connected' || msgtype == 'error') {
          resolve(resp);
        }
      });
    });
  },

  saveVolatile_meta: true,
  async saveVolatile({ conid, user, password, test }) {
    const old = await this.getCore({ conid });
    const res = {
      ...old,
      _id: crypto.randomUUID(),
      password,
      passwordMode: undefined,
      unsaved: true,
    };
    if (old.passwordMode == 'askUser') {
      res.user = user;
    }

    if (test) {
      const testRes = await this.test(res);
      if (testRes.msgtype == 'connected') {
        volatileConnections[res._id] = res;
        return {
          ...res,
          msgtype: 'connected',
        };
      }
      return testRes;
    } else {
      volatileConnections[res._id] = res;
      return res;
    }
  },

  save_meta: true,
  async save(connection) {
    let res;
    const old = await this.datastore.get(connection._id);
    if (old) {
      res = await this.datastore.update(connection);
    } else {
      res = await this.datastore.insert(connection);
    }
    if (this._closeAll) {
      this._closeAll(connection._id);
    }
    // const encrypted = encryptConnection(connection);
    // if (connection._id) {
    //   res = await this.datastore.update(encrypted);
    // } else {
    //   res = await this.datastore.insert(encrypted);
    // }
    // socket.emitChanged('connection-list-changed');
    // socket.emitChanged('used-apps-changed');
    // if (this._closeAll) {
    //   this._closeAll(connection._id);
    // }
    // for (const db of connection.databases || []) {
    //   socket.emitChanged(`db-apps-changed-${connection._id}-${db.name}`);
    // }
    return res;
  },

  update_meta: true,
  async update({ _id, values }, req) {
    const res = await this.datastore.patch(_id, values);
    return res;
    // testConnectionPermission(_id, req);
    // if (portalConnections) return;
    // testConnectionPermission(_id, req);
    // const res = await this.datastore.patch(_id, values);
    // socket.emitChanged('connection-list-changed');
    // return res;
  },

  batchChangeFolder_meta: true,
  async batchChangeFolder({ folder, newFolder }, req) {
    const res = await this.datastore.updateAll(x => (x.parent == folder ? { ...x, parent: newFolder } : x));
    return res;
    // const res = await this.datastore.updateAll(x => (x.parent == folder ? { ...x, parent: newFolder } : x));
    // socket.emitChanged('connection-list-changed');
    // return res;
  },

  updateDatabase_meta: true,
  async updateDatabase({ conid, database, values }, req) {
    const conn = await this.datastore.get(conid);
    let databases = (conn && conn.databases) || [];
    if (databases.find(x => x.name == database)) {
      databases = databases.map(x => (x.name == database ? { ...x, ...values } : x));
    } else {
      databases = [...databases, { name: database, ...values }];
    }
    const res = await this.datastore.patch(conid, { databases });
    return res;
    // if (portalConnections) return;
    // testConnectionPermission(conid, req);
    // const conn = await this.datastore.get(conid);
    // let databases = (conn && conn.databases) || [];
    // if (databases.find(x => x.name == database)) {
    //   databases = databases.map(x => (x.name == database ? { ...x, ...values } : x));
    // } else {
    //   databases = [...databases, { name: database, ...values }];
    // }
    // const res = await this.datastore.patch(conid, { databases });
    // socket.emitChanged('connection-list-changed');
    // socket.emitChanged('used-apps-changed');
    // return res;
  },

  delete_meta: true,
  async delete(connection, req) {
    const res = await this.datastore.remove(connection._id);
    return res;
    // testConnectionPermission(connection, req);
    // if (portalConnections) return;
    // testConnectionPermission(connection, req);
    // const res = await this.datastore.remove(connection._id);
    // socket.emitChanged('connection-list-changed');
    // return res;
  },

  async getCore({ conid, mask = false }) {
    if (!conid) return null;
    const volatile = volatileConnections[conid];
    if (volatile) {
      return volatile;
    }
    const res = await this.datastore.get(conid);
    return res || null;
    // if (!conid) return null;
    // const volatile = volatileConnections[conid];
    // if (volatile) {
    //   return volatile;
    // }
    // if (portalConnections) {
    //   const res = portalConnections.find(x => x._id == conid) || null;
    //   return mask && !platformInfo.allowShellConnection ? maskConnection(res) : res;
    // }
    // const res = await this.datastore.get(conid);
    // return res || null;
  },

  get_meta: true,
  async get({ conid }, req) {
    // testConnectionPermission(conid, req);
    if (!conid) {
      return null;
    }
    // const username = conid.split('_')[0];
    // const auth = req.auth;
    // if (auth.username !== username) {
    //   return null;
    // }
    return this.getCore({ conid, mask: true });
  },

  newSqliteDatabase_meta: true,
  async newSqliteDatabase({ file }) {
    const sqliteDir = path.join(filesdir(), 'sqlite');
    if (!(await fs.exists(sqliteDir))) {
      await fs.mkdir(sqliteDir);
    }
    const databaseFile = path.join(sqliteDir, `${file}.sqlite`);
    const res = await this.save({
      engine: 'sqlite@dbgate-plugin-sqlite',
      databaseFile,
      singleDatabase: true,
      defaultDatabase: `${file}.sqlite`,
    });
    return res;
  },
};
