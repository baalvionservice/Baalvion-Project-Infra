const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('proxies', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    provider_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ip: {
      type: DataTypes.INET,
      allowNull: false
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    country: {
      type: DataTypes.CHAR(2),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    success_rate: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 100
    },
    latency: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    bandwidth_limit: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    bandwidth_used: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    health_score: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 100
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'proxies',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_proxies_lookup",
        fields: [
          { name: "country" },
          { name: "type" },
          { name: "status" },
          { name: "health_score" },
        ]
      },
      {
        name: "idx_proxies_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "proxies_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
