const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('auth_audit_logs', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, allowNull: false, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: true },
    auth_type: { type: DataTypes.TEXT, allowNull: false },
    outcome: { type: DataTypes.TEXT, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    api_key_id: { type: DataTypes.UUID, allowNull: true },
    user_id: { type: DataTypes.BIGINT, allowNull: true },
    ip_address: { type: DataTypes.INET, allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true }
  }, {
    sequelize,
    tableName: 'auth_audit_logs',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'auth_audit_logs_pkey', unique: true, fields: [{ name: 'id' }] },
      { name: 'idx_auth_audit_org_id', fields: [{ name: 'org_id' }] },
      { name: 'idx_auth_audit_outcome', fields: [{ name: 'outcome' }] },
      { name: 'idx_auth_audit_created_at', fields: [{ name: 'created_at' }] }
    ]
  });
};
