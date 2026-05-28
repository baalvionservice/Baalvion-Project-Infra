const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('proxy_sessions', {
    id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    api_key_id: { type: DataTypes.UUID, allowNull: true },
    session_token: { type: DataTypes.TEXT, allowNull: false },
    customer: { type: DataTypes.TEXT, allowNull: true },
    zone: { type: DataTypes.TEXT, allowNull: true },
    country: { type: DataTypes.TEXT, allowNull: true },
    rotation: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'rotating' },
    status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'active' },
    ip_address: { type: DataTypes.INET, allowNull: true },
    exit_ip: { type: DataTypes.TEXT, allowNull: true },
    bytes_in: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    bytes_out: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    last_seen_at: { type: DataTypes.DATE, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'proxy_sessions',
    schema: 'public',
    timestamps: true,
    indexes: [
      { name: 'proxy_sessions_pkey', unique: true, fields: [{ name: 'id' }] },
      { name: 'idx_proxy_sessions_org_id', fields: [{ name: 'org_id' }] },
      { name: 'idx_proxy_sessions_api_key_id', fields: [{ name: 'api_key_id' }] },
      { name: 'idx_proxy_sessions_status', fields: [{ name: 'status' }] },
      { name: 'uq_proxy_sessions_org_token', unique: true, fields: [{ name: 'org_id' }, { name: 'session_token' }] }
    ]
  });
};
