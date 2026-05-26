module.exports = function (sequelize, DataTypes) {
    return sequelize.define('deliverables', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        partnership_id: { type: DataTypes.BIGINT, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        platform: { type: DataTypes.STRING(100), allowNull: true },
        deliverable_type: { type: DataTypes.STRING(100), allowNull: true },
        due_date: { type: DataTypes.DATEONLY, allowNull: true },
        submitted_at: { type: DataTypes.DATE, allowNull: true },
        approved_at: { type: DataTypes.DATE, allowNull: true },
        content_url: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(32), defaultValue: 'pending' },
        revision_notes: { type: DataTypes.TEXT, allowNull: true },
        performance_metrics: { type: DataTypes.JSONB, defaultValue: {} },
    }, {
        tableName: 'deliverables',
        schema: 'brand',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['partnership_id'] },
            { fields: ['status'] },
            { fields: ['due_date'] },
        ],
    });
};
