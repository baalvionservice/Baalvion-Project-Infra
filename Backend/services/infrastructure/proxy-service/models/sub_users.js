const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sub_users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    parent_user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    gb_limit: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    usage_gb: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'sub_users',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_sub_users_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "sub_users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
