'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('agent', {
        id:                 { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        org_id:             { type: DataTypes.STRING(128), allowNull: true },
        user_id:            { type: DataTypes.STRING(64), allowNull: true },  // linked platform user, if any
        code:               { type: DataTypes.STRING(32), allowNull: false, unique: true }, // referral/agent code
        name:               { type: DataTypes.STRING(160), allowNull: false },
        email:              { type: DataTypes.STRING(160), allowNull: true },
        tier:               { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'agent' }, // agent|senior|lead|partner
        status:             { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' }, // active|suspended|inactive
        parent_agent_id:    { type: DataTypes.UUID, allowNull: true },  // override hierarchy
        commission_plan_id: { type: DataTypes.UUID, allowNull: true },
        metadata:           { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by:         { type: DataTypes.STRING(64), allowNull: true },
        created_at:         { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at:         { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        tableName: 'agents', schema: 'agent', timestamps: false,
        indexes: [{ unique: true, fields: ['code'] }, { fields: ['org_id'] }, { fields: ['parent_agent_id'] }, { fields: ['status'] }],
    });
};
