const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('invoices', {
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
    subscription_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'invoices',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_invoices_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "invoices_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
