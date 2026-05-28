const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transactions', {
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
    gateway: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    risk_score: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    gateway_order_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'transactions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_transactions_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "idx_transactions_user_created",
        fields: [
          { name: "user_id" },
          { name: "created_at", order: "DESC" },
        ]
      },
      {
        name: "transactions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
