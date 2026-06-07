module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cms_workflows', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        contentId: { type: DataTypes.UUID, allowNull: false, unique: true },
        currentState: {
            type: DataTypes.ENUM(
                'draft', 'pending_review', 'changes_requested', 'compliance_review',
                'approved', 'scheduled', 'published', 'archived'
            ),
            allowNull: false,
            defaultValue: 'draft',
        },
        submittedBy: { type: DataTypes.BIGINT, allowNull: true },
        reviewedBy: { type: DataTypes.BIGINT, allowNull: true },
        approvedBy: { type: DataTypes.BIGINT, allowNull: true },
        publishedBy: { type: DataTypes.BIGINT, allowNull: true },
        submittedAt: { type: DataTypes.DATE, allowNull: true },
        reviewedAt: { type: DataTypes.DATE, allowNull: true },
        approvedAt: { type: DataTypes.DATE, allowNull: true },
        publishedAt: { type: DataTypes.DATE, allowNull: true },
        comments: { type: DataTypes.TEXT, allowNull: true },
        scheduledPublishAt: { type: DataTypes.DATE, allowNull: true },
        // BullMQ job id for scheduled publish
        scheduleJobId: { type: DataTypes.STRING(100), allowNull: true },
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
