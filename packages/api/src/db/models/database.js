const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Database = sequelize.define(
    'Database',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      db_name: {
        type: DataTypes.STRING,
      },
      db_type: {
        type: DataTypes.STRING,
      },
      db_dbname: {
        type: DataTypes.STRING,
      },
      db_ip: {
        type: DataTypes.STRING,
      },
      db_port: {
        type: DataTypes.NUMBER,
      },
      db_userId: {
        type: DataTypes.STRING,
      },
      db_pwd: {
        type: DataTypes.STRING,
      },
      db_owner: {
        type: DataTypes.STRING,
      },
      db_status: {
        type: DataTypes.CHAR,
      },
      create_by: {
        type: DataTypes.STRING,
      },
      create_time: {
        type: DataTypes.DATE,
      },
      update_by: {
        type: DataTypes.STRING,
      },
      update_time: {
        type: DataTypes.DATE,
      },
      group_id: {
        type: DataTypes.NUMBER,
      },
      trino_flag: {
        type: DataTypes.NUMBER,
      },
      trino_catalog: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'tbl_database',
      timestamps: false,
    }
  );
  // Database.associate = function (models) {
  //   Database.hasMany(models.DatabaseGroup, { foreignKey: 'dbId' });
  // };
  return Database;
};
