function getEngine(val) {
  let engine;
  switch (val.toLowerCase()) {
    case 'mysql':
      engine = 'mysql@dbgate-plugin-mysql';
      break;
    case 'mariadb':
      engine = 'mariadb@dbgate-plugin-mysql';
      break;
    case 'postgresql':
      engine = 'postgres@dbgate-plugin-postgres';
      break;
    case 'sqlserver':
      engine = 'mssql@dbgate-plugin-mssql';
      break;
    case 'sqlite':
      engine = 'sqlite@dbgate-plugin-sqlite';
      break;
    case 'cockroachdb':
      engine = 'cockroach@dbgate-plugin-postgres';
      break;
    case 'oracle':
      engine = 'oracle@dbgate-plugin-oracle';
      break;
    case 'amazonredshift':
      engine = 'redshift@dbgate-plugin-postgres';
    default:
      engine = '';
      break;
  }
  return engine;
}

function getRealIp(req) {
  let ipAddress = req.header['x-forwarded-for'] || req.header['x-real-ip'] || req.connection.remoteAddress;
  if (ipAddress instanceof Array) {
    ipAddress = ipAddress[0];
  }
  return ipAddress;
}

module.exports = {
  getEngine,
  getRealIp,
};
