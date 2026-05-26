'use strict';

module.exports = (sequelize, DataTypes) => {
    const Dispute = sequelize.define('Dispute', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: { tableName: 'orders', schema: 'mining' }, key: 'id' },
        },
        complainant_id: { type: DataTypes.INTEGER, allowNull: true },
        respondent_id: { type: DataTypes.INTEGER, allowNull: true },
        category: { type: DataTypes.STRING(100), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        evidence_urls: { type: DataTypes.JSONB, defaultValue: [] },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'filed',
            validate: { isIn: [['filed', 'under_review', 'resolved', 'closed']] },
        },
        resolution: { type: DataTypes.TEXT, allowNull: true },
        admin_notes: { type: DataTypes.TEXT, allowNull: true },
    }, {
        tableName: 'disputes',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    Dispute.associate = (models) => {
        Dispute.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
    };

    return Dispute;
};
