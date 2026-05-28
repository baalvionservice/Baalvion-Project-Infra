const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('provider_incidents', {
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
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "open"
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'provider_incidents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "provider_incidents_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
