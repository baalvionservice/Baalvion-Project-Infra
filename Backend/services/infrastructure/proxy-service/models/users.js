const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "users_email_key"
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    plan_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    full_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    company: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timezone: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    mfa_secret: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    token_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_users_email",
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "idx_users_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "users_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "users_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
