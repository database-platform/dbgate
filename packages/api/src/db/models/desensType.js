const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const DesensType = sequelize.define(
    'DesensType',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      desen_type_name: {
        type: DataTypes.STRING,
      },
      desen_type_code: {
        type: DataTypes.STRING,
      },
      remark: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
      },
      desen_char: {
        type: DataTypes.STRING,
      },
      desen_len: {
        type: DataTypes.INTEGER,
      },
      mask_type: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'tbl_desens_type',
      timestamps: false,
    }
  );
  return DesensType;
};
