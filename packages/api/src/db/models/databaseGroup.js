const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DatabaseGroup = sequelize.define(
    'DatabaseGroup',
    {
      dbId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
      },
      groupId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tbl_database_dbgroup',
      timestamps: false,
    }
  );
  DatabaseGroup.associate = function (models) {
    DatabaseGroup.belongsTo(models.Group, { foreignKey: 'groupId' });
    DatabaseGroup.belongsTo(models.Database, { foreignKey: 'dbId' });
  };

  return DatabaseGroup;
};
