const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('support_tickets', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "open"
    },
    priority: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "normal"
    }
  }, {
    sequelize,
    tableName: 'support_tickets',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_support_tickets_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "support_tickets_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
