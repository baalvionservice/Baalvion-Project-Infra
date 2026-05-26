const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('proxy_usage_logs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    proxy_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    bandwidth_used: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    response_time: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'proxy_usage_logs',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "idx_proxy_usage_logs_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "idx_proxy_usage_user_time",
        fields: [
          { name: "user_id" },
          { name: "timestamp", order: "DESC" },
        ]
      },
      {
        name: "proxy_usage_logs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
