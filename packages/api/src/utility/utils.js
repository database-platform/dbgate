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
    case 'tidb':
      engine = 'tidb@dbgate-plugin-mysql';
      break;
    case 'oceanbase':
      engine = 'oceanbase@dbgate-plugin-mysql';
      break;
    case 'gbase':
      engine = 'gbase@dbgate-plugin-mysql';
      break;
    case 'gauss':
      engine = 'gauss@dbgate-plugin-mysql';
      break;
    case 'golder':
      engine = 'golder@dbgate-plugin-mysql';
      break;
    case 'opengauss':
      engine = 'opengauss@dbgate-plugin-postgres';
      break;
    case 'polardb':
      engine = 'polardb@dbgate-plugin-postgres';
      break;
    case 'kingbase':
      engine = 'kingbase@dbgate-plugin-postgres';
      break;
    case 'dameng':
      engine = 'dameng@dbgate-plugin-dameng';
      break;
    default:
      engine = 'unknow type';
      break;
  }
  return engine;
}

function getRealIp(req) {
  let ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress;
  if (ipAddress instanceof Array) {
    ipAddress = ipAddress[0];
  }
  return ipAddress;
}

module.exports = {
  getEngine,
  getRealIp,
};
