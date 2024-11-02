const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);
const { getLogger } = require('dbgate-tools');
const logger = getLogger('Sequelize');

const db = {};
async function init() {
  const env = process.env.NODE_ENV;
  logger.info(`NODE_ENV: ${env}`);

  const dbUri = process.env.DB_URL.replace('jdbc:', '');
  logger.info(`DB db uri: ${dbUri}`);
  const pwd = fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim();
  const sequelize = new Sequelize(dbUri, {
    username: process.env.DB_USER,
    password: pwd,
    dialect: 'mysql',
    logging: false,
    // logging:
    //   env === 'production' || env === 'production_self'
    //     ? false
    //     : message => {
    //       logger.debug({ message }, '');
    //     },
  });

  // const sequelize = new Sequelize(process.env.ONLINE_DATABASE_URL, {
  //   dialect: 'mysql',
  //   logging: env === 'production' || env === 'production_self' ? false : true,
  // });

  fs.readdirSync(__dirname)
    .filter(file => {
      return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
}

async function testConnection() {
  try {
    await db.sequelize.authenticate();
    logger.info('Connection has been established successfully.');
  } catch (error) {
    logger.error(`Unable to connect to the database: ${error.message}`);
  }
}

init();

testConnection();

module.exports = db;
