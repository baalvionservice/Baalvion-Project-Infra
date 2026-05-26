const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('provider_health', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    provider_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    latency_ms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    success_rate: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'provider_health',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "provider_health_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
