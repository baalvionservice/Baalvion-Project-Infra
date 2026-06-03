const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('subscriptions', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    plan_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    current_period_start: {
      type: DataTypes.DATE,
      allowNull: false
    },
    current_period_end: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cancel_at_period_end: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    grace_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // Columns added by migration but previously missing from this model snapshot —
    // without them Sequelize silently dropped plan_slug on create/update, so the
    // subscription always read back as the fallback 'starter'.
    plan_slug: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    enforcement_mode: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'pay-as-you-go'
    },
    stripe_customer_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    stripe_subscription_id: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'subscriptions',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "idx_subscriptions_org_id",
        fields: [
          { name: "org_id" },
        ]
      },
      {
        name: "idx_subscriptions_user_status",
        fields: [
          { name: "user_id" },
          { name: "status" },
        ]
      },
      {
        name: "subscriptions_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
