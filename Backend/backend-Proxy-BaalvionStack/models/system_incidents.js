const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('system_incidents', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'system_incidents',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "system_incidents_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
