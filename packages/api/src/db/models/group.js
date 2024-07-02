const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const Group = sequelize.define(
    'Group',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
      },
      isExpire: {
        type: DataTypes.STRING,
      },
      expireAt: {
        type: DataTypes.DATE,
      },
      remark: {
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
      tableName: 'tbl_group',
      timestamps: false,
    }
  );
  Group.associate = function (models) {
    Group.hasMany(models.DatabaseGroup, { foreignKey: 'groupId' });
  };
  return Group;
};
