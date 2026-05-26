'use strict';
const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('presets', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.TEXT, allowNull: true },
    country: { type: DataTypes.TEXT, allowNull: true },
    protocol: { type: DataTypes.TEXT, allowNull: true, defaultValue: 'http' },
    rotation: { type: DataTypes.TEXT, allowNull: true, defaultValue: 'rotating' },
  }, {
    sequelize,
    tableName: 'presets',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'presets_pkey', unique: true, fields: [{ name: 'id' }] },
      { name: 'idx_presets_org_id', fields: [{ name: 'org_id' }] },
    ]
  });
};
