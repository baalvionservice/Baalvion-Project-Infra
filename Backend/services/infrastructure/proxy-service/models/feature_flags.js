const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('feature_flags', {
    key: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    default_value: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    plans: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    }
  }, {
    sequelize,
    tableName: 'feature_flags',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "feature_flags_pkey",
        unique: true,
        fields: [
          { name: "key" },
        ]
      },
    ]
  });
};
