'use strict';
module.exports = (sequelize, DataTypes) => {
    const GroupMember = sequelize.define('GroupMember', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        group_id: { type: DataTypes.INTEGER, allowNull: false },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        role: { type: DataTypes.STRING(20), defaultValue: 'member' },
    }, {
        schema: 'legal',
        tableName: 'group_members',
        underscored: true,
        timestamps: true,
        createdAt: 'joined_at',
        updatedAt: false,
    });

    GroupMember.associate = (db) => {
        GroupMember.belongsTo(db.DiscussionGroup, { foreignKey: 'group_id', as: 'group' });
        GroupMember.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
    };

    return GroupMember;
};
