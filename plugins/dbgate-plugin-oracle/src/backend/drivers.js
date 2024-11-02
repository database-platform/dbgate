const _ = require('lodash');
const stream = require('stream');

const driverBases = require('../frontend/drivers');
const Analyser = require('./Analyser');
const oracledb = require('oracledb');
const { makeUniqueColumnNames } = require('dbgate-tools');
const createOracleBulkInsertStream = require('./createOracleBulkInsertStream');
// const { Parser } = require('node-sql-parser');
// const parser = new Parser();
/*
pg.types.setTypeParser(1082, 'text', val => val); // date
pg.types.setTypeParser(1114, 'text', val => val); // timestamp without timezone
pg.types.setTypeParser(1184, 'text', val => val); // timestamp
*/

function extractOracleColumns(columns, sql) {
  if (!columns /*|| !result.fields */) return [];
  const res = columns.map(fld => ({
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
    serviceName,
    ssl,
    isReadOnly,
    authType,
    socketPath,
  }) {
    // const options = {
    //   user,
    //   password,
    //   connectionString: useDatabaseUrl ? databaseUrl : port ? `${server}:${port}/${serviceName}` : server
    // }
    client = await oracledb.getConnection({
      user,
      password,
      connectString: useDatabaseUrl ? databaseUrl : port ? `${server}:${port}/${serviceName}` : server,
    });
    if (database) {
      await client.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${database}`);
    }
    client._schema_name = database;
    //const pool = await getOracledb().createPool(options);
    //client = await pool.getConnection();
    return client;
  },
  async close(pool) {
    return pool.end();
  },
  async query(client, sql) {
    if (sql.trim() == 'COMMIT;') {
      sql = 'COMMIT';
    }

    if (sql == null) {
      return {
        rows: [],
        columns: [],
      };
    }
    try {
      const res = await client.execute(sql);
      const columns = extractOracleColumns(res.metaData);
      return { rows: (res.rows || []).map(row => zipDataRow(row, columns)), columns };
    } catch (err) {
      console.log('Error query', err, sql);
    } finally {
      //console.log('finally', sql);
    }
  },
  stream(client, sql, options) {
    if (sql.trim().toLowerCase().startsWith('select')) {
      const query = client.queryStream(sql, {}, { extendedMetaData: true });
      // const consumeStream = new Promise((resolve, reject) => {
      let rowcount = 0;
      let wasHeader = false;

      query.on('metadata', row => {
        if (!wasHeader) {
          columns = extractOracleColumns(row, sql);
          if (columns && columns.length > 0) {
            options.recordset(columns);
          }
          wasHeader = true;
        }

        // options.row(zipDataRow(row, columns));
      });

      query.on('data', row => {
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
    } else {
      client.execute(sql, (err, res) => {
        if (err) {
          options.info({
            message: err.message,
            time: new Date(),
            serverity: 'error',
          });
        } else {
          const { rowsAffected, metaData, rows } = res || {};

          if (rows && metaData) {
            const colums = extractOracleColumns(metaData);
            options.recordset(colums);
            for (const row of rows) {
              options.row(zipDataRow(row, colums));
            }
          } else if (rowsAffected) {
            options.info({
              message: `${rowsAffected} rows affected`,
              time: new Date(),
              serverity: 'info',
            });
          }
        }
        options.done();
      });
    }
    //const numrows = await consumeStream;
    //console.log('Rows selected: ' + numrows);
    //client.query(query);
  },
  async getVersionCore(client) {
    try {
      const { rows } = await this.query(
        client,
        "SELECT product || ' ' || version_full as \"version\" FROM product_component_version WHERE product LIKE 'Oracle%Database%'"
      );
      return rows[0].version.replace(' ', ' ');
    } catch (error) {
      const { rows } = await this.query(client, 'SELECT banner as "version" FROM v$version');
      return rows[0].version;
    }
  },
  async getVersion(client) {
    try {
      // const { rows } = await this.query(client, "SELECT banner_full as version FROM v$version WHERE banner LIKE 'Oracle%'");
      // const { rows } = await this.query(client, 'SELECT version as "version" FROM v$instance');
      const version = await this.getVersionCore(client);
      // Oracle Database 18c Express Edition Release 18.0.0.0.0 - Production Version 18.4.0.0.0

      const m = version.match(/(\d+[a-z])\s+(\w+).*(\d+)\.(\d+)/);

      // console.log('oracle getVersion ', version);
      let versionText = null;
      let versionMajor = null;
      let versionMinor = null;
      if (m) {
        versionText = `Oracle ${m[1]} ${m[2]}`;
        if (m[3]) versionMajor = parseInt(m[3]);
        if (m[4]) versionMinor = parseInt(m[4]);
      }

      return {
        version,
        versionText,
        versionMajor,
        versionMinor,
      };
    } catch (e) {
      return {
        version: '???',
        versionText: 'Oracle ???',
        versionMajor: null,
        versionMinor: null,
      };
    }
  },
  async readQuery(client, sql, structure) {
    const query = await client.queryStream(sql);

    let wasHeader = false;
    let columns = null;

    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });

    query.on('metadata', row => {
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
      pass.write(zipDataRow(row, columns));
    });

    query.on('end', () => {
      pass.end();
    });

    query.on('error', error => {
      pass.end();
    });

    //client.query(query);

    return pass;
  },
  async writeTable(pool, name, options) {
    // @ts-ignore
    return createOracleBulkInsertStream(this, stream, pool, name, options);
  },
  async listDatabases(client) {
    const { rows } = await this.query(client, 'SELECT username AS "name" FROM all_users order by username');
    return rows;
  },
  async tabColumns(client, inCondition) {
    if (!inCondition) {
      return [];
    }
    const sql = `SELECT table_name as "pureName", column_name as "columnName" FROM all_tab_columns WHERE owner='${client._schema_name}' and table_name IN (${inCondition})`;
    const { rows } = await this.query(client, sql);
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

module.exports = drivers;
