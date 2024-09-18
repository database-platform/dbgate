const _ = require('lodash');
const stream = require('stream');
var dmdb = require('dmdb');

const driverBase = require('../frontend/driver');
const Analyser = require('./Analyser');
const { makeUniqueColumnNames } = require('dbgate-tools');

const { getLogger } = global.DBGATE_TOOLS;

const logger = getLogger('damengDriver');

function extractColumns(fields) {
  if (fields) {
    const res = fields.map((col) => ({
      columnName: col.name,
    }));
    makeUniqueColumnNames(res);
    return res;
  }
  return [];
}

function zipDataRow(rowArray, columns) {
  return _.zipObject(
    columns.map((x) => x.columnName),
    rowArray
  );
}

/** @type {import('dbgate-types').EngineDriver} */
const driver = {
  ...driverBase,
  analyserClass: Analyser,
  // creating connection
  async connect({ server, port, user, password, databaseUrl, useDatabaseUrl, database }) {
    const pool = await dmdb.createPool({
      // connectString: "dm://SYSDBA:SYSDBA\@localhost:5236?autoCommit=false",
      connectString: `dm://${user}:${password}\@${server}:${port}?autoCommit=false&loginEncrypt=false`,
      poolMax: 2,
      poolMin: 1,
    });
    const connection = await pool.getConnection();
    if (database) {
      await connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${database}`);
    }
    client._schema_name = database;
    return connection;
  },
  async close(pool) {
    await pool.close();
  },
  // called for retrieve data (eg. browse in data grid) and for update database
  async query(connection, sql) {
    logger.info({ sql }, 'sql');
    if (sql == null) {
      return {
        rows: [],
        columns: [],
      };
    }

    const res = await connection.execute(sql);
    // logger.info({ res }, 'res');
    const columns = extractColumns(res.metaData);
    // logger.info({ columns }, 'columns');
    return { rows: (res.rows || []).map((row) => zipDataRow(row, columns)), columns };
  },
  // called in query console
  async stream(connection, sql, options) {
    return null;
  },
  // called when exporting table or view
  async readQuery(connection, sql, structure) {
    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });

    // pass.write(structure)
    // pass.write(row1)
    // pass.write(row2)
    // pass.end()

    return pass;
  },
  // called when importing into table or view
  async writeTable(connection, name, options) {
    return createBulkInsertStreamBase(this, stream, pool, name, options);
  },
  // detect server version
  async getVersion(connection) {
    const { rows } = await this.query(connection, 'SELECT banner AS "name" FROM v$version;');
    console.log('rows: ', rows);
    let version = '';
    rows.map((row) => {
      if (version) {
        version += ' ' + row.name;
      } else {
        version = row.name;
      }
    });

    return { version, versionText: `Dameng ${version}` };
  },
  // list databases on server
  async listDatabases(connection) {
    const { rows } = await this.query(connection, 'SELECT DISTINCT owner AS "name" FROM dba_objects');
    console.log('listDatabases rows: ', rows);
    return rows;
  },
};

module.exports = driver;
