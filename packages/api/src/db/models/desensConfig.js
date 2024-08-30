const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DesensConfig = sequelize.define(
    'DesensConfig',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      desen_type: {
        type: DataTypes.INTEGER,
      },
      desen_name: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'sys_desen_config',
      timestamps: false,
    }
  );
  DesensConfig.associate = function (models) {
    DesensConfig.hasOne(models.DesensType, { sourceKey: 'desen_type', foreignKey: 'id' });
  };
  return DesensConfig;
};
