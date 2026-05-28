const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('failed_auth_attempts', {
    id: { type: DataTypes.BIGINT, autoIncrement: true, allowNull: false, primaryKey: true },
    identifier: { type: DataTypes.TEXT, allowNull: false },
    auth_type: { type: DataTypes.TEXT, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.INET, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: true }
  }, {
    sequelize,
    tableName: 'failed_auth_attempts',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'failed_auth_attempts_pkey', unique: true, fields: [{ name: 'id' }] },
      { name: 'idx_failed_auth_identifier', fields: [{ name: 'identifier' }] },
      { name: 'idx_failed_auth_created_at', fields: [{ name: 'created_at' }] }
    ]
  });
};
