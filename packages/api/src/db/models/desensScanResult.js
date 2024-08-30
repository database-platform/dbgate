const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DesensScanResult = sequelize.define(
    'DesensScanResult',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      db_id: {
        type: DataTypes.NUMBER,
      },
      db_name: {
        type: DataTypes.STRING,
      },
      table_name: {
        type: DataTypes.STRING,
      },
      col_name: {
        type: DataTypes.STRING,
      },
      desen_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tbl_desen_result',
      timestamps: false,
    }
  );
  DesensScanResult.associate = function (models) {
    DesensScanResult.hasOne(models.DesensConfig, { sourceKey: 'desen_id', foreignKey: 'id' });
  };
  return DesensScanResult;
};
