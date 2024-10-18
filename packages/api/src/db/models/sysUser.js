const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const SysUser = sequelize.define(
    'SysUser',
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },
      user_name: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'sys_user',
      timestamps: false,
    }
  );
  SysUser.associate = function (models) {
    SysUser.hasOne(models.DataBaseUserGroup, { foreignKey: 'userId', sourceKey: 'user_id', as: 'group' });
  };
  return SysUser;
};
