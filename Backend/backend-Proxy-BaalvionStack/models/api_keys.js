const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('api_keys', {
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
    key_prefix: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    key_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'active'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_used_ip: {
      type: DataTypes.INET,
      allowNull: true
    },
    rate_limit_per_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 600
    },
    environment: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'live'
    },
    key_type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'api'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    rotated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'api_keys',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "api_keys_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_api_keys_key_prefix",
        fields: [
          { name: "key_prefix" },
        ]
      },
      {
        name: "idx_api_keys_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
    ]
  });
};
