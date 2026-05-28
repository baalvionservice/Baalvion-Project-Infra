const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('api_key_scopes', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    api_key_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    scope: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'api_key_scopes',
    schema: 'public',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: "api_key_scopes_pkey",
        unique: true,
        fields: [{ name: "id" }]
      },
      {
        name: "uq_api_key_scopes",
        unique: true,
        fields: [{ name: "api_key_id" }, { name: "scope" }]
      },
      {
        name: "idx_api_key_scopes_api_key_id",
        fields: [{ name: "api_key_id" }]
      }
    ]
  });
};
