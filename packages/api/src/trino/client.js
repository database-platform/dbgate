const { Trino } = require('trino-client');

function getTrino({ catalog, schema }) {
  return Trino.create({
    server: process.env.TRINO_URL,
    catalog,
    schema,
    // auth: new BasicAuth('test'),
  });
}

module.exports = {
  getTrino,
};
