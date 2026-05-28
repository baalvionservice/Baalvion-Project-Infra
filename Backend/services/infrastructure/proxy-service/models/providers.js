const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('providers', {
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
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    failover_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    health_score: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 100
    },
    countries_supported: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    }
  }, {
    sequelize,
    tableName: 'providers',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "providers_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
