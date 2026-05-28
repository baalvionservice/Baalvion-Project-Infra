const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('usage_records', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    bandwidth_gb: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    requests: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    success_rate: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    avg_latency_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'usage_records',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_usage_records_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "idx_usage_records_period_start",
        fields: [
          { name: "period_start" },
        ]
      },
      {
        name: "usage_records_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
