const _ = require('lodash');
const stream = require('stream');

const driverBases = require('../frontend/drivers');
const Analyser = require('./Analyser');
//--const pg = require('pg');
//const oracledb = require('oracledb');
const { createBulkInsertStreamBase, makeUniqueColumnNames } = require('dbgate-tools');


let requireOracledb; // native module

let oracledbValue;
function getOracledb() {
  if (!oracledbValue) {
    oracledbValue = requireOracledb();
  }
  return oracledbValue;
}

/*
pg.types.setTypeParser(1082, 'text', val => val); // date
pg.types.setTypeParser(1114, 'text', val => val); // timestamp without timezone
pg.types.setTypeParser(1184, 'text', val => val); // timestamp
*/

function extractOracleColumns(result) {
  if (!result /*|| !result.fields */) return [];
  const res = result.map(fld => ({
    columnName: fld.name, //columnName: fld.name.toLowerCase(),
  }));
  makeUniqueColumnNames(res);
  return res;
}

function zipDataRow(rowArray, columns) {
  let obj = _.zipObject(
    columns.map(x => x.columnName),
    rowArray
  );
  //console.log('zipDataRow columns', columns);
  //console.log('zipDataRow', obj);
  return obj;
}

/** @type {import('dbgate-types').EngineDriver} */
const drivers = driverBases.map(driverBase => ({
  ...driverBase,
  analyserClass: Analyser,

  async connect({
    engine,
    server,
    port,
    user,
    password,
    database,
    databaseUrl,
    useDatabaseUrl,
    ssl,
    isReadOnly,
    authType,
    socketPath,
  }) {
    const options = {
      user,
      password,
      connectionString: database ? `${server}:${port}/${database}` : `${server}:${port}`
    }
    // connection = await oracledb.getConnection({ user: "demonode", password: "demonode123", connectionString: "192.168.3.196/xepdb1" });
    const pool = await getOracledb().createPool(options);
    client = await pool.getConnection();
    return client;
  },
  async close(pool) {
    return pool.end();
  },
  async query(client, sql) {
    console.log('query sql', sql);
    if (sql == null) {
      return {
        rows: [],
        columns: [],
      };
    }
    try {
      //console.log('sql3', sql);
      const res = await client.execute(sql);
      //console.log('res', res);
      const columns = extractOracleColumns(res.metaData);
      //console.log('columns', columns);
      return { rows: (res.rows || []).map(row => zipDataRow(row, columns)), columns };
    } catch (err) {
      console.log('Error query', err, sql);
    } finally {
      //console.log('finally', sql);
    }
  },
  stream(client, sql, options) {
    /*
    const query = new pg.Query({
      text: sql,
      rowMode: 'array',
    });
*/
    console.log('queryStream', sql);
    const query = client.queryStream(sql);
    // const consumeStream = new Promise((resolve, reject) => {
    let rowcount = 0;
    let wasHeader = false;

    query.on('metadata', row => {
      // console.log('metadata', row);
      if (!wasHeader) {
        columns = extractOracleColumns(row);
        if (columns && columns.length > 0) {
          options.recordset(columns);
        }
        wasHeader = true;
      }

      // options.row(zipDataRow(row, columns));
    });

    query.on('data', row => {
      // console.log('stream DATA');
      if (!wasHeader) {
        columns = extractOracleColumns(row);
        if (columns && columns.length > 0) {
          options.recordset(columns);
        }
        wasHeader = true;
      }
      options.row(zipDataRow(row, columns));
    });

    query.on('end', () => {
      const { command, rowCount } = query._result || {};

      if (command != 'SELECT' && _.isNumber(rowCount)) {
        options.info({
          message: `${rowCount} rows affected`,
          time: new Date(),
          severity: 'info',
        });
      }

      if (!wasHeader) {
        columns = extractOracleColumns(query._result);
        if (columns && columns.length > 0) {
          options.recordset(columns);
        }
        wasHeader = true;
      }

      options.done();
    });

    query.on('error', error => {
      console.log('ERROR', error);
      const { message, lineNumber, procName } = error;
      options.info({
        message,
        line: lineNumber,
        procedure: procName,
        time: new Date(),
        severity: 'error',
      });
      options.done();
    });
    query.on('close', function () {
      //console.log("stream 'close' event");
      // The underlying ResultSet has been closed, so the connection can now
      // be closed, if desired.  Note: do not close connections on 'end'.
      //resolve(rowcount);
    });
    //});

    //const numrows = await consumeStream;
    //console.log('Rows selected: ' + numrows);
    //client.query(query);
  },
  async getVersion(client) {
    const { rows } = await this.query(client, "SELECT banner_full as version FROM v$version WHERE banner LIKE 'Oracle%'");
    // const { rows } = await this.query(client, 'SELECT version as "version" FROM v$instance');
    const { VERSION: version } = rows[0];
    // Oracle Database 18c Express Edition Release 18.0.0.0.0 - Production Version 18.4.0.0.0

    const isCockroach = false; //version.toLowerCase().includes('cockroachdb');
    const isRedshift = false; // version.toLowerCase().includes('redshift');
    const isOracle = true;

    console.log('M', version);
    let versionText = null;
    let versionMajor = null;
    let versionMinor = null;
    if (version) {
      if (isOracle) versionText = `${version}`;
    }

    return {
      version,
      versionText,
      isOracle,
      isCockroach,
      isRedshift,
      versionMajor,
      versionMinor,
    };
  },
  async readQuery(client, sql, structure) {
    /*
    const query = new pg.Query({
      text: sql,
      rowMode: 'array',
    });
*/
    console.log('readQuery', sql, structure);
    const query = await client.queryStream(sql);

    let wasHeader = false;
    let columns = null;

    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });

    query.on('metadata', row => {
      // console.log('readQuery metadata', row);
      if (!wasHeader) {
        columns = extractOracleColumns(row);
        if (columns && columns.length > 0) {
          pass.write({
            __isStreamHeader: true,
            ...(structure || { columns }),
          });
        }
        wasHeader = true;
      }

      pass.write(zipDataRow(row, columns));
    });

    query.on('data', row => {
      // console.log('readQuery data', row);
      pass.write(zipDataRow(row, columns));
    });

    query.on('end', () => {
      pass.end();
    });

    query.on('error', error => {
      console.error(error);
      pass.end();
    });

    //client.query(query);

    return pass;
  },
  async writeTable(pool, name, options) {
    // @ts-ignore
    return createBulkInsertStreamBase(this, stream, pool, name, options);
  },
  async listDatabases(client) {
    // const { rows } = await this.query(client, 'SELECT instance_name AS "name" FROM v$instance');
    const { rows } = await this.query(client, 'SELECT ORA_DATABASE_NAME AS "name" FROM DUAL');
    console.log('rows ', rows)
    return rows;
  },

  getAuthTypes() {
    return [
      {
        title: 'Host and port',
        name: 'hostPort',
      },
      {
        title: 'Socket',
        name: 'socket',
      },
    ];
  },
}));

drivers.initialize = dbgateEnv => {
  console.log('initialize', dbgateEnv);
  if (dbgateEnv.nativeModules && dbgateEnv.nativeModules.oracledb) {
    requireOracledb = dbgateEnv.nativeModules.oracledb;
  }
};

module.exports = drivers;
