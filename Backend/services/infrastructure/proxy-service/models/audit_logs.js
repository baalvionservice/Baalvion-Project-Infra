const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('audit_logs', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    actor_user_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    actor_api_key_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actor_type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'user'
    },
    entity_uuid: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    sequelize,
    tableName: 'audit_logs',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "audit_logs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "idx_audit_admin_created",
        fields: [
          { name: "admin_id" },
          { name: "created_at", order: "DESC" },
        ]
      },
      {
        name: "idx_audit_logs_created_at",
        fields: [
          { name: "created_at" },
        ]
      },
      {
        name: "idx_audit_logs_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
    ]
  });
};
