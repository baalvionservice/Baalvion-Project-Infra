'use strict';
module.exports = (sequelize, DataTypes) => {
    const IrBoardMaterial = sequelize.define('IrBoardMaterial', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        meeting_date: { type: DataTypes.DATEONLY },
        classification: { type: DataTypes.STRING(32), defaultValue: 'Confidential' }, // Public|Restricted|Confidential
        related_votes: { type: DataTypes.JSONB, defaultValue: [] },
        document_ids: { type: DataTypes.JSONB, defaultValue: [] },
        workflow_status: { type: DataTypes.STRING(32), defaultValue: 'Draft' },
        version_history: { type: DataTypes.JSONB, defaultValue: [] },
        created_by: { type: DataTypes.INTEGER },
    }, { schema: 'ir', tableName: 'ir_board_materials', underscored: true, timestamps: true });
    return IrBoardMaterial;
};
