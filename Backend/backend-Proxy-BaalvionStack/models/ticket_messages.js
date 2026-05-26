const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ticket_messages', {
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
    ticket_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    author_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ticket_messages',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_ticket_messages_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "ticket_messages_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
