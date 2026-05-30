'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrVote = sequelize.define('IrVote', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT },
        resolution_text: { type: DataTypes.TEXT },
        created_by_role: { type: DataTypes.STRING(64) },
        eligible_roles: { type: DataTypes.JSONB, defaultValue: [] },
        status: { type: DataTypes.ENUM('Draft', 'Open', 'Closed', 'Archived', 'Invalid'), defaultValue: 'Draft' },
        start_date: { type: DataTypes.DATE },
        end_date: { type: DataTypes.DATE },
        votes: { type: DataTypes.JSONB, defaultValue: [] },
        version_history: { type: DataTypes.JSONB, defaultValue: [] },
        created_by: { type: DataTypes.INTEGER },
    }, { schema: 'ir', tableName: 'ir_votes', underscored: true, timestamps: true });
    return IrVote;
};
