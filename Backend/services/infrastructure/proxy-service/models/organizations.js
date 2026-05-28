const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('organizations', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: "organizations_slug_key"
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "active"
    },
    plan_slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "starter"
    },
    bandwidth_limit_gb: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    bandwidth_used_gb: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'organizations',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_organizations_slug",
        fields: [
          { name: "slug" },
        ]
      },
      {
        name: "organizations_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "organizations_slug_key",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
};
