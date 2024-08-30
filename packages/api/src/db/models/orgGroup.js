const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const OrgGroup = sequelize.define(
    'OrgGroup',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      group_name: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'tbl_datagroup',
      timestamps: false,
    }
  );
  return OrgGroup;
};
