const { driverBase } = require('dbgate-tools');
const Dumper = require('./Dumper');

/** @type {import('dbgate-types').SqlDialect} */
const dialect = {
  limitSelect: true,
  rangeSelect: true,
  offsetFetchRangeSyntax: true,
  stringEscapeChar: "'",
  fallbackDataType: 'nvarchar(max)',
  quoteIdentifier(s) {
    return `[${s}]`;
  },
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
