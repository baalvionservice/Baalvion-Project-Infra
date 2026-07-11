'use strict';
module.exports = (sequelize, DataTypes) => {
    const Complaint = sequelize.define('Complaint', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        reporter_user_id: { type: DataTypes.TEXT, allowNull: false },
        subject_lawyer_id: { type: DataTypes.INTEGER },
        category: { type: DataTypes.STRING(40), defaultValue: 'other' },
        description: { type: DataTypes.TEXT, allowNull: false },
        status: {
            type: DataTypes.ENUM('open', 'investigating', 'resolved', 'dismissed'),
            defaultValue: 'open',
        },
        resolution: { type: DataTypes.TEXT },
        resolved_by: { type: DataTypes.TEXT },
        resolved_at: { type: DataTypes.DATE },
    }, {
        schema: 'legal',
        tableName: 'complaints',
        underscored: true,
        timestamps: true,
    });

    Complaint.associate = (db) => {
        Complaint.belongsTo(db.Lawyer, { foreignKey: 'subject_lawyer_id', as: 'lawyer' });
    };

    return Complaint;
};
