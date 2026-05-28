const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('plans', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    bandwidth_limit: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    proxy_types_allowed: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    overage_price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0
    },
    session_limits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rotation_rules: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'plans',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "plans_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
