const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('org_memberships', {
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
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    role: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    invited_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'active'
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'org_memberships',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_org_memberships_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "org_memberships_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
