const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('abuse_logs', {
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
    event_type: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    risk_score: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    action_taken: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'abuse_logs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "abuse_logs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_abuse_logs_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
    ]
  });
};
