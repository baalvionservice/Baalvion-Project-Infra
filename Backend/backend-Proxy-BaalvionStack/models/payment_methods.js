const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('payment_methods', {
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
    last4: {
      type: DataTypes.CHAR(4),
      allowNull: false
    },
    brand: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    expiry: {
      type: DataTypes.STRING(12),
      allowNull: false
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'payment_methods',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_payment_methods_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "payment_methods_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
