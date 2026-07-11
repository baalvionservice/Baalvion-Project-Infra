'use strict';
module.exports = (sequelize, DataTypes) => {
    const CaseReferral = sequelize.define('CaseReferral', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        from_lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        to_lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        country_code: { type: DataTypes.STRING(2) },
        state_id: { type: DataTypes.INTEGER },
        city_id: { type: DataTypes.INTEGER },
        practice_area_id: { type: DataTypes.INTEGER },
        case_id: { type: DataTypes.INTEGER },
        title: { type: DataTypes.STRING(500), allowNull: false },
        description: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.ENUM('sent', 'accepted', 'declined', 'case_shared', 'completed', 'cancelled'),
            defaultValue: 'sent',
        },
        fee_disclosure: { type: DataTypes.JSONB },
    }, {
        schema: 'legal',
        tableName: 'case_referrals',
        underscored: true,
        timestamps: true,
    });

    CaseReferral.associate = (db) => {
        CaseReferral.belongsTo(db.Lawyer, { foreignKey: 'from_lawyer_id', as: 'fromLawyer' });
        CaseReferral.belongsTo(db.Lawyer, { foreignKey: 'to_lawyer_id', as: 'toLawyer' });
        CaseReferral.belongsTo(db.State, { foreignKey: 'state_id', as: 'state' });
        CaseReferral.belongsTo(db.City, { foreignKey: 'city_id', as: 'city' });
        CaseReferral.belongsTo(db.PracticeArea, { foreignKey: 'practice_area_id', as: 'practiceArea' });
        CaseReferral.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
    };

    return CaseReferral;
};
