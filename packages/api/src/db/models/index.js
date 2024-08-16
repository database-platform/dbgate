const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const basename = path.basename(__filename);

const env = process.env.NODE_ENV;
console.log('env ', env);

console.log('env base url: ', process.env.ONLINE_DATABASE_URL);
const db = {};
const sequelize = new Sequelize(process.env.ONLINE_DATABASE_URL, {
  dialect: 'mysql',
  logging: false,
});

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

module.exports = db;
