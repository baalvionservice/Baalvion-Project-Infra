module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_workflows', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        content_id: { type: DataTypes.UUID, allowNull: false, unique: true },
        current_state: {
            type: DataTypes.ENUM(
                'draft', 'pending_review', 'changes_requested',
                'approved', 'scheduled', 'published', 'archived'
            ),
            allowNull: false,
            defaultValue: 'draft',
        },
        submitted_by: { type: DataTypes.BIGINT, allowNull: true },
        reviewed_by: { type: DataTypes.BIGINT, allowNull: true },
        approved_by: { type: DataTypes.BIGINT, allowNull: true },
        published_by: { type: DataTypes.BIGINT, allowNull: true },
        submitted_at: { type: DataTypes.DATE, allowNull: true },
        reviewed_at: { type: DataTypes.DATE, allowNull: true },
        approved_at: { type: DataTypes.DATE, allowNull: true },
        published_at: { type: DataTypes.DATE, allowNull: true },
        comments: { type: DataTypes.TEXT, allowNull: true },
        scheduled_publish_at: { type: DataTypes.DATE, allowNull: true },
        // BullMQ job id for scheduled publish
        schedule_job_id: { type: DataTypes.STRING(100), allowNull: true },
    }, {
        sequelize,
        tableName: 'cms_workflows',
        schema: 'cms',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['content_id'], name: 'cms_workflows_content_unique' },
            { fields: ['current_state'] },
            { fields: ['submitted_by'] },
        ],
    });
};
