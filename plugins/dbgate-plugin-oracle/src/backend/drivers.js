const _ = require('lodash');
const stream = require('stream');

const driverBases = require('../frontend/drivers');
const Analyser = require('./Analyser');
//--const pg = require('pg');
const oracledb = require('oracledb');
const { createBulkInsertStreamBase, makeUniqueColumnNames } = require('dbgate-tools');
const createOracleBulkInsertStream = require('./createOracleBulkInsertStream');
const { Parser } = require('node-sql-parser');
const parser = new Parser();
/*
pg.types.setTypeParser(1082, 'text', val => val); // date
pg.types.setTypeParser(1114, 'text', val => val); // timestamp without timezone
pg.types.setTypeParser(1184, 'text', val => val); // timestamp
*/

function extractOracleColumns(result, sql) {
  if (!result /*|| !result.fields */) return [];
  let from;
  let res;
  if (sql) {
    try {
      const ast = parser.astify(sql);
      from = ast.from;
      // console.log('ast: ', ast);
      const star = ast.columns.find(item => item.expr.column === '*');
      if (star) {
        res = getColumnsByStar(result, from);
      } else {
        res = ast.columns.map(item => {
          return {
            columnName: item.expr.column,
            oname: getOriginColumnName(item.expr.column),
            table: getTableByAs(from, item.expr.table),
          };
        });
      }
    } catch (error) {
      console.error('extractOracleColumns parser sql: ', error.message);
    }
  } else {
    res = getColumnsByDefault(result);
  }
  // console.log('oracle columns: ', res);
  makeUniqueColumnNames(res);
  return res;
}

// column: { expr: { type: 'column_ref', table: 't', column: 'age' }, as: null }
// from: { db: null, table: 'EMPLOYEES', as: 'e' },
function getTableByAs(from, as) {
  // console.log('as: ', as);
  const find = from.find(item => item.as === as);
  return find ? find.table : '';
}

function getColumnsByDefault(result, from) {
  return result.map(fld => ({
    columnName: fld.name, //columnName: fld.name.toLowerCase(),
    oname: getOriginColumnName(fld.name),
    table: from ? getTableNameByStar(from, fld.name) : null,
  }));
}

/**
 *
 * select * from xxx
 *from: [
  { db: null, table: 'EMPLOYEES', as: 'e' },
  {
    db: null,
    table: 'TBL_USER',
    as: 't',
    join: 'LEFT JOIN',
    on: [Object]
  }
]
name: NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
 */
function getColumnsByStar(result, from) {
  const columns = [];
  let preIndex = 0;
  let obj;
  result.map(fld => {
    const lastIndex = fld.name.lastIndexOf('_');
    if (!obj && lastIndex === -1) {
      obj = from[0];
    } else {
      const asIndex = fld.name.substring(lastIndex + 1, fld.name.length);
      // console.log('asIndex ', asIndex);
      if (!isNaN(Number(asIndex))) {
        if (preIndex !== asIndex) {
          obj = from[asIndex];
          preIndex = asIndex;
        }
      }
    }
    // console.log('obj ', obj);
    columns.push({
      columnName: fld.name, //columnName: fld.name.toLowerCase(),
      oname: getOriginColumnName(fld.name),
      table: obj.table,
    });
  });
  return columns;
}
/**
 *
 * select * from xxx
 *from: [
  { db: null, table: 'EMPLOYEES', as: 'e' },
  {
    db: null,
    table: 'TBL_USER',
    as: 't',
    join: 'LEFT JOIN',
    on: [Object]
  }
]
name: NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
 */
function getTableNameByStar(from, name) {
  from?.forEach(item => {
    if (name.includes(item.as + '.')) {
      return item.table;
    }
  });
}

// NAME, NAME_1, FIRST_NAME, FIRST_NAME_1
// return NAME, FIRST_NAME
function getOriginColumnName(name) {
  const lastIndex = name.lastIndexOf('_');
  if (lastIndex === -1) {
    return name;
  }
  return name.substring(0, lastIndex);
}

function zipDataRow(rowArray, columns) {
  let obj = _.zipObject(
    columns.map(x => x.columnName),
    rowArray
  );
  // console.log('zipDataRow columns', columns);
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
    console.log('query sql', sql);
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
    console.log('stream', sql);
    if (sql.trim().toLowerCase().startsWith('select')) {
      const query = client.queryStream(sql);
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
          // console.log('_result: ', row);
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
          const { rowAffected, metaData, rows } = res || {};

          if (rows && metaData) {
            const colums = extractOracleColumns(metaData);
            options.recordset(colums);
            for (const row of rows) {
              options.row(zipDataRow(row, colums));
            }
          } else if (rowAffected) {
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

      // console.log('M', version);
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
    /*
    const query = new pg.Query({
      text: sql,
      rowMode: 'array',
    });
  */
    // console.log('readQuery', sql, structure);
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
      // console.error(error);
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
    // const { rows } = await this.query(client, 'SELECT ORA_DATABASE_NAME AS "name" FROM DUAL');
    // console.log('rows ', rows);
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
