const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('webhook_logs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    gateway: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    payload_json: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    signature_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    processed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'webhook_logs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "webhook_logs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
