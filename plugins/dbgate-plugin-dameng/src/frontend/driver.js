const { driverBase } = require('dbgate-tools');
const Dumper = require('./Dumper');

/** @type {import('dbgate-types').SqlDialect} */
const dialect = {
  limitSelect: true,
  rangeSelect: true,
  offsetFetchRangeSyntax: true,
  stringEscapeChar: "'",
  fallbackDataType: 'varchar',
  anonymousPrimaryKey: true,
  enableConstraintsPerTable: true,
  dropColumnDependencies: ['dependencies'],
  quoteIdentifier(s) {
    return '"' + s + '"';
  },
  createColumn: true,
  dropColumn: true,
  changeColumn: true,
  createIndex: true,
  dropIndex: true,
  createForeignKey: true,
  dropForeignKey: true,
  createPrimaryKey: true,
  dropPrimaryKey: true,
  createUnique: true,
  dropUnique: true,
  createCheck: true,
  dropCheck: true,

  dropReferencesWhenDropTable: true,

  predefinedDataTypes: [
    'VARCHAR2',
    'NUMBER',
    'DATE',
    'CLOB',
    'BLOB',
    'INTEGER',

    'BFILE',
    'BINARY_DOUBLE',
    'BINARY_FLOAT',
    'CHAR',
    'FLOAT',
    'INTERVAL DAY',
    'INTERVAL YEAR',
    'LONG',
    'LONG RAW',
    'NCHAR',
    'NCLOB',
    'NVARCHAR2',
    'RAW',
    'ROWID',
    'TIMESTAMP',
    'UROWID',
    // 'XMLTYPE',
  ],
};

/** @type {import('dbgate-types').EngineDriver} */
const driver = {
  ...driverBase,
  dumperClass: Dumper,
  dialect,
  engine: 'dameng@dbgate-plugin-dameng',
  title: 'Dameng',
  defaultPort: 5236,
  showConnectionField: (field, values) => {
    return ['server', 'port', 'user', 'password', 'defaultDatabase', 'singleDatabase', 'isReadOnly'].includes(field);
  },
};

module.exports = driver;
