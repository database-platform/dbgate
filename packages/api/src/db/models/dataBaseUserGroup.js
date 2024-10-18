const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DataBaseUserGroup = sequelize.define(
    'DataBaseUserGroup',
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      groupId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tbl_database_usergroup',
      timestamps: false,
    }
  );
  return DataBaseUserGroup;
};
