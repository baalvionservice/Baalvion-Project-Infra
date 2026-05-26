module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_approval_logs', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        workflow_id: { type: DataTypes.UUID, allowNull: false },
        content_id: { type: DataTypes.UUID, allowNull: false },
        actor_id: { type: DataTypes.BIGINT, allowNull: false },
        action: {
            type: DataTypes.ENUM(
                'submit_for_review', 'approve', 'request_changes',
                'publish', 'schedule', 'unpublish', 'archive',
                'restore_to_draft', 'autosave'
            ),
            allowNull: false,
        },
        from_state: { type: DataTypes.STRING(32), allowNull: false },
        to_state: { type: DataTypes.STRING(32), allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        metadata: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    }, {
        sequelize,
        tableName: 'cms_approval_logs',
        schema: 'cms',
        timestamps: true,
        updatedAt: false,
        underscored: true,
        indexes: [
            { fields: ['workflow_id'] },
            { fields: ['content_id'] },
            { fields: ['actor_id'] },
            { fields: ['action'] },
            { fields: ['created_at'] },
        ],
    });
};
