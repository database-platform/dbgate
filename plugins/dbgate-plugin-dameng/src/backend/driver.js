const _ = require('lodash');
const stream = require('stream');
var dmdb = require('dmdb');
const { makeUniqueColumnNames } = require('dbgate-tools');
const driverBase = require('../frontend/driver');
const Analyser = require('./Analyser');
const { getLogger } = global.DBGATE_TOOLS;

const logger = getLogger('damengDriver');

function extractColumns(columns) {
  if (!columns) {
    return [];
  }
  const res = columns.map((col) => ({
    columnName: col.name,
  }));
  makeUniqueColumnNames(res);
  return res;
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
    // const pool = await dmdb.createPool({
    //   // connectString: "dm://SYSDBA:SYSDBA\@localhost:5236?autoCommit=false",
    //   connectString: `dm://${user}:${password}\@${server}:${port}?autoCommit=false&loginEncrypt=false`,
    //   poolMax: 2,
    //   poolMin: 1,
    // });
    try {
      client = await dmdb.getConnection({
        user,
        password,
        connectString: useDatabaseUrl ? databaseUrl : `${server}:${port || 5236}`,
        loginEncrypt: false,
        extendedMetaData: true,
      });
      if (database) {
        await client.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${database}`);
      }
      client._schema_name = database;
    } catch (error) {
      logger.error({ error }, 'DM connection error: ');
    }
    return client;
  },
  async close(pool) {
    await pool.close();
  },
  // called for retrieve data (eg. browse in data grid) and for update database
  async query(client, sql) {
    if (sql == null) {
      return {
        rows: [],
        columns: [],
      };
    }
    console.log('query ', client, sql);
    const mtrim = sql.match(/^(.*);\s*$/s);
    if (mtrim) {
      sql = mtrim[1];
    }

    const res = await client.execute(sql);
    try {
      const columns = extractColumns(res.metaData);
      return { rows: (res.rows || []).map((row) => zipDataRow(row, columns)), columns };
    } catch (error) {
      return {
        rows: [],
        columns: [],
      };
    }
  },
  // called in query console
  async stream(client, sql, options) {
    if (sql.trim().toLowerCase().startsWith('select')) {
      let query = client.queryStream(sql);

      let wasHeader = false;
      query.on('metadata', (row) => {
        if (!wasHeader) {
          columns = extractColumns(row);
          if (columns && columns.length > 0) {
            options.recordset(columns);
          }
          wasHeader = true;
        }
      });

      query.on('data', (row) => {
        if (!wasHeader) {
          columns = extractColumns(row);
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
            serverity: 'info',
          });
        }

        if (!wasHeader) {
          columns = extractColumns(query._result);
          if (columns && columns.length > 0) {
            options.recordset(columns);
          }
          wasHeader = true;
        }
        options.done();
      });
      query.on('error', (error) => {
        const { message, lineNumber, procName } = error;
        options.info({
          message,
          line: lineNumber,
          procedure: procName,
          time: new Date(),
          serverity: 'error',
        });
        options.done();
      });
      // query.on('close', () => { });
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
            const columns = extractColumns(metaData);
            options.recordset(columns);
            for (const row of rows) {
              options.row(zipDataRow(row, columns));
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
  },
  // called when exporting table or view
  async readQuery(client, sql, structure) {
    const query = await client.queryStream(sql);
    console.log('readQuery :', client, sql);
    let wasHeader = false;
    let columns = null;

    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });
    // pass.write(structure)
    // pass.write(row1)
    // pass.write(row2)
    // pass.end()

    query.on('metadata', (row) => {
      if (!wasHeader) {
        columns = extractColumns(row);
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

    query.on('data', (row) => {
      pass.write(zipDataRow(row, columns));
    });

    query.on('end', () => {
      pass.end();
    });

    query.on('error', (error) => {
      logger.error({ error }, 'readQuery error: ');
      pass.end();
    });

    return pass;
  },
  // called when importing into table or view
  async writeTable(connection, name, options) {
    console.log('dm writeTable');
    return createBulkInsertStreamBase(this, stream, pool, name, options);
  },
  // detect server version
  //  [
  //       { name: 'DM Database Server 64 V8' },
  //       { name: 'DB Version: 0x7000c' },
  //       { name: '03134284194-20240621-232765-20108' },
  //       { name: 'Msg Version: 12' },
  //       { name: 'Gsu level(5) cnt: 0' }
  // ]
  async getVersion(client) {
    try {
      const { rows } = await this.query(client, 'SELECT banner AS "name" FROM v$version');
      // console.log('dm getVersion: ', rows);
      let num;
      if (rows[1]) {
        num = parseInt(rows[1].name?.split(':')[1], 16);
      }
      return {
        version: num,
        versionText: `Dameng ${rows[0]?.name}`,
      };
    } catch (error) {
      return {
        version: '???',
        versionText: 'DM ???',
        versionMajor: null,
        versionMinor: null,
      };
    }
  },
  // list databases on server
  async listDatabases(client) {
    const { rows } = await this.query(client, 'SELECT username AS "name" FROM all_users ORDER BY username');
    console.log('dm listDatabases: ', rows);
    return rows;
  },
  async tabColumns(client, inCondition) {
    if (!inCondition) {
      logger.error('tabColumns in condition is null.');
      return [];
    }
    const sql = `SELECT table_name as "pureName", column_name as "columnName" FROM all_tab_columns WHERE owner='${client._schema_name}' and table_name IN (${inCondition})`;
    const { rows } = await this.query(client, sql);
    return rows;
  },
};

module.exports = driver;
