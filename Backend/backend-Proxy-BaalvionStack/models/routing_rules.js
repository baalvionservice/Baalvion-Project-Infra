const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('routing_rules', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    match: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    provider_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'routing_rules',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "routing_rules_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
