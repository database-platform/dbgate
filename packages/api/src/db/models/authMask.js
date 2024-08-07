const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const AuthMask = sequelize.define(
    'AuthMask',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.INTEGER,
      },
      desen_id: {
        type: DataTypes.INTEGER,
      },
      mode: {
        type: DataTypes.STRING,
      },
      hide_placeholder: {
        type: DataTypes.STRING,
      },
      mask_type: {
        type: DataTypes.STRING,
      },
      mask_len: {
        type: DataTypes.INTEGER,
      },
      mask_start: {
        type: DataTypes.INTEGER,
      },
      mask_end: {
        type: DataTypes.INTEGER,
      },
      mask_replace: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'tbl_auth_mask',
      timestamps: false,
    }
  );
  AuthMask.associate = function (models) {
    AuthMask.hasOne(models.DesensType, { sourceKey: 'desen_id', foreignKey: 'id' });
  };
  return AuthMask;
};
