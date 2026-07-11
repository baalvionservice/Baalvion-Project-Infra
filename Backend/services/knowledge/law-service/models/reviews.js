'use strict';
module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        booking_id: { type: DataTypes.INTEGER, allowNull: true },
        client_id: { type: DataTypes.INTEGER, allowNull: true },
        lawyer_id: { type: DataTypes.INTEGER, allowNull: false },
        // NUMERIC not INTEGER: a 4-dimension average (e.g. 4.25) needs fractional
        // precision, matching legal.lawyers.rating's existing NUMERIC(3,2).
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        comment: { type: DataTypes.TEXT },
        // 4-dimension breakdown (spec area 8). Nullable: legacy reviews and any
        // review submitted without a breakdown carry only the overall `rating`.
        professionalism: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
        communication: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
        expertise: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
        timeliness: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
        // Lawyer-to-lawyer review after a completed case_referral, instead of a
        // client's booking. Exactly one of (booking_id+client_id) or
        // (case_referral_id+reviewer_lawyer_id) is populated per row.
        case_referral_id: { type: DataTypes.INTEGER },
        reviewer_lawyer_id: { type: DataTypes.INTEGER },
    }, {
        schema: 'legal',
        tableName: 'reviews',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });

    Review.associate = (db) => {
        Review.belongsTo(db.Booking, { foreignKey: 'booking_id', as: 'booking' });
        Review.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
        Review.belongsTo(db.Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });
        Review.belongsTo(db.CaseReferral, { foreignKey: 'case_referral_id', as: 'caseReferral' });
        Review.belongsTo(db.Lawyer, { foreignKey: 'reviewer_lawyer_id', as: 'reviewerLawyer' });
    };

    return Review;
};
