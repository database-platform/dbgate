const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DatabaseAuth = sequelize.define(
    'DatabaseAuth',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      group_id: {
        type: DataTypes.STRING,
      },
      db_id: {
        type: DataTypes.STRING,
      },
      db_type: {
        type: DataTypes.STRING,
      },
      owner: {
        type: DataTypes.STRING,
      },
      schema: {
        type: DataTypes.STRING,
      },
      tname: {
        type: DataTypes.STRING,
      },
      tcolumn: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      type_opts: {
        type: DataTypes.STRING,
      },
      dql: {
        type: DataTypes.TINYINT,
      },
      dml: {
        type: DataTypes.TINYINT,
      },
      dcl: {
        type: DataTypes.TINYINT,
      },
      ddl: {
        type: DataTypes.TINYINT,
      },
      tty: {
        type: DataTypes.TINYINT,
      },
      dql_export: {
        type: DataTypes.TINYINT,
      },
      dml_insert: {
        type: DataTypes.TINYINT,
      },
      dml_update: {
        type: DataTypes.TINYINT,
      },
      dml_delete: {
        type: DataTypes.TINYINT,
      },
      ddl_create_db: {
        type: DataTypes.TINYINT,
      },
      ddl_drop_db: {
        type: DataTypes.TINYINT,
      },
      ddl_alter_db: {
        type: DataTypes.TINYINT,
      },
      ddl_create: {
        type: DataTypes.TINYINT,
      },
      ddl_drop: {
        type: DataTypes.TINYINT,
      },
      ddl_alter: {
        type: DataTypes.TINYINT,
      },
      ddl_rename: {
        type: DataTypes.TINYINT,
      },
      ddl_truncate: {
        type: DataTypes.TINYINT,
      },
      dcl_grant_revoke: {
        type: DataTypes.TINYINT,
      },
      dcl_create_user: {
        type: DataTypes.TINYINT,
      },
      maskId: {
        type: DataTypes.STRING,
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
    },
    {
      tableName: 'tbl_database_auth',
      timestamps: false,
    }
  );
  DatabaseAuth.associate = function (models) {
    //Group.hasMany(models.DatabaseGroup, { foreignKey: 'groupId' });
  };
  return DatabaseAuth;
};
