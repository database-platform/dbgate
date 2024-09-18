const _ = require('lodash');
const stream = require('stream');

const driverBases = require('../frontend/drivers');
const Analyser = require('./Analyser');
const pg = require('pg');
const { createBulkInsertStreamBase, makeUniqueColumnNames } = require('dbgate-tools');
const { getLogger } = global.DBGATE_TOOLS;

const logger = getLogger('postreDriver');

pg.types.setTypeParser(1082, 'text', val => val); // date
pg.types.setTypeParser(1114, 'text', val => val); // timestamp without timezone
pg.types.setTypeParser(1184, 'text', val => val); // timestamp

function extractPostgresColumns(result) {
  if (!result || !result.fields) return [];
  const res = result.fields.map(fld => ({
    columnName: fld.name,
  }));
  makeUniqueColumnNames(res);
  return res;
}

function zipDataRow(rowArray, columns) {
  return _.zipObject(
    columns.map(x => x.columnName),
    rowArray
  );
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
    let options = null;

    if (engine == 'redshift@dbgate-plugin-postgres') {
      let url = databaseUrl;
      if (url && url.startsWith('jdbc:redshift://')) {
        url = url.substring('jdbc:redshift://'.length);
      }
      if (user && password) {
        url = `postgres://${user}:${password}@${url}`;
      } else if (user) {
        url = `postgres://${user}@${url}`;
      } else {
        url = `postgres://${url}`;
      }

      options = {
        connectionString: url,
      };
    } else {
      let dbase = database;
      if (engine == 'kingbase@dbgate-plugin-postgres') {
        dbase = database || 'TEST';
      } else {
        dbase = database || 'postgres';
      }
      options = useDatabaseUrl
        ? {
            connectionString: databaseUrl,
            application_name: 'Dbmanager',
          }
        : {
            host: authType == 'socket' ? socketPath || driverBase.defaultSocketPath : server,
            port: authType == 'socket' ? null : port,
            user,
            password,
            database: dbase,
            ssl,
            application_name: 'DbGate',
          };
    }
    const client = new pg.Client(options);
    await client.connect();

    if (isReadOnly) {
      await this.query(client, 'SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
    }

    return client;
  },
  async close(pool) {
    return pool.end();
  },
  async query(client, sql) {
    if (sql == null) {
      return {
        rows: [],
        columns: [],
      };
    }
    // console.log('postgres sql: ', sql);
    const res = await client.query({ text: sql, rowMode: 'array' });
    const columns = extractPostgresColumns(res);
    return { rows: (res.rows || []).map(row => zipDataRow(row, columns)), columns };
  },
  stream(client, sql, options) {
    const query = new pg.Query({
      text: sql,
      rowMode: 'array',
    });

    let wasHeader = false;

    query.on('row', row => {
      if (!wasHeader) {
        columns = extractPostgresColumns(query._result);
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
        columns = extractPostgresColumns(query._result);
        if (columns && columns.length > 0) {
          options.recordset(columns);
        }
        wasHeader = true;
      }

      options.done();
    });

    query.on('error', error => {
      logger.error({ error }, 'Stream error');
      const { message, position, procName } = error;
      let line = null;
      if (position) {
        line = sql.substring(0, parseInt(position)).replace(/[^\n]/g, '').length;
      }
      options.info({
        message,
        line,
        procedure: procName,
        time: new Date(),
        severity: 'error',
      });
      options.done();
    });

    client.query(query);
  },
  async getVersion(client) {
    const { rows } = await this.query(client, 'SELECT version()');
    const { version } = rows[0];
    //  PostgreSQL 15.8 (PolarDB 15.8.2.0 build unknown) on x86_64-linux-gnu
    //  KingbaseES V008R006C008B0020 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 4.8.5 20150623 (Red Hat 4.8.5-28), 64-bit
    //
    console.log('version: ', version);
    const isCockroach = version.toLowerCase().includes('cockroachdb');
    const isRedshift = version.toLowerCase().includes('redshift');
    const isPolardb = version.toLowerCase().includes('polardb');
    const isOpengauss = version.toLowerCase().includes('opengauss');
    const isKingbase = version.toLowerCase().includes('kingbase');
    const isPostgres = !isCockroach && !isRedshift && !isPolardb && !isOpengauss && !isKingbase;
    let kingbaseVersion;
    if (isKingbase) {
      try {
        kingbaseVersion = version.split(' ')[1];
      } catch (error) {
        console.error('postgres driver: ', error);
      }
    }
    const m = version.match(/([\d\.]+)/);
    let versionText = null;
    let versionMajor = null;
    let versionMinor = null;
    if (m) {
      if (isCockroach) versionText = `CockroachDB ${m[1]}`;
      if (isRedshift) versionText = `Redshift ${m[1]}`;
      if (isPolardb) versionText = `PolarDB-PG ${m[1]}`;
      if (isOpengauss) versionText = `Opengauss ${m[1]}`;
      if (isKingbase) versionText = `KingbaseES ${kingbaseVersion}`;
      if (isPostgres) versionText = `PostgreSQL ${m[1]}`;
      const numbers = m[1].split('.');
      if (numbers[0]) versionMajor = parseInt(numbers[0]);
      if (numbers[1]) versionMinor = parseInt(numbers[1]);
    }

    return {
      version,
      versionText,
      isPostgres,
      isCockroach,
      isRedshift,
      isPolardb,
      isOpengauss,
      versionMajor,
      versionMinor,
    };
  },
  async readQuery(client, sql, structure) {
    // console.log('readQuery sql: ', sql);
    const query = new pg.Query({
      text: sql,
      rowMode: 'array',
    });

    let wasHeader = false;
    let columns = null;

    const pass = new stream.PassThrough({
      objectMode: true,
      highWaterMark: 100,
    });

    query.on('row', row => {
      if (!wasHeader) {
        columns = extractPostgresColumns(query._result);
        pass.write({
          __isStreamHeader: true,
          ...(structure || { columns }),
        });
        wasHeader = true;
      }

      pass.write(zipDataRow(row, columns));
    });

    query.on('end', () => {
      if (!wasHeader) {
        columns = extractPostgresColumns(query._result);
        pass.write({
          __isStreamHeader: true,
          ...(structure || { columns }),
        });
        wasHeader = true;
      }

      pass.end();
    });

    query.on('error', error => {
      console.error(error);
      pass.end();
    });

    client.query(query);

    return pass;
  },
  async writeTable(pool, name, options) {
    // @ts-ignore
    return createBulkInsertStreamBase(this, stream, pool, name, options);
  },
  async listDatabases(client) {
    const { rows } = await this.query(client, 'SELECT datname AS name FROM pg_database WHERE datistemplate = false');
    // console.log('listDatabases rows: ', rows);
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
