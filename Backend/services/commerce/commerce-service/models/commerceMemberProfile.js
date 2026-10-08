'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_member_profiles', {
        userId: { type: DataTypes.BIGINT, primaryKey: true },
        memberNumber: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        displayName: { type: DataTypes.STRING(80), allowNull: true },
    }, { schema: 'commerce', tableName: 'commerce_member_profiles', underscored: true, timestamps: true });
};
