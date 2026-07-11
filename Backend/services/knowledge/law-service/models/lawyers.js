'use strict';
module.exports = (sequelize, DataTypes) => {
    const Lawyer = sequelize.define('Lawyer', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.TEXT, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        specializations: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        bar_number: { type: DataTypes.STRING(100) },
        // Global directory: country of practice (ISO alpha-2 + display name) so the
        // network is browsable across all 188 countries; jurisdictions = sub-regions.
        country_code: { type: DataTypes.STRING(2) },
        country: { type: DataTypes.STRING(100) },
        city: { type: DataTypes.STRING(120) },
        // Relational geo (registration wizard Steps 1-3). Nullable: existing rows
        // keep rendering via the free-text country/city columns above until backfilled.
        state_id: { type: DataTypes.INTEGER },
        city_id: { type: DataTypes.INTEGER },
        jurisdictions: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        // Personal Details (registration wizard).
        dob: { type: DataTypes.DATEONLY },
        gender: { type: DataTypes.STRING(20) },
        // Professional Details (registration wizard).
        license_number: { type: DataTypes.STRING(100) },
        firm_name: { type: DataTypes.STRING(255) },
        is_independent: { type: DataTypes.BOOLEAN, defaultValue: true },
        experience: { type: DataTypes.INTEGER, defaultValue: 0 },
        hourly_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
        total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
        bio: { type: DataTypes.TEXT },
        profile_photo: { type: DataTypes.TEXT },
        languages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        availability: { type: DataTypes.JSONB, defaultValue: {} },
        // Public-profile "Available for" flags (spec: Consultation / Case
        // Referral / International Collaboration).
        available_for: {
            type: DataTypes.JSONB,
            defaultValue: { consultation: true, case_referral: false, international_collaboration: false },
        },
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        status: {
            type: DataTypes.ENUM('active', 'suspended', 'pending'),
            defaultValue: 'pending',
        },
    }, {
        schema: 'legal',
        tableName: 'lawyers',
        underscored: true,
        timestamps: true,
    });

    Lawyer.associate = (db) => {
        Lawyer.hasMany(db.Booking, { foreignKey: 'lawyer_id', as: 'bookings' });
        Lawyer.hasMany(db.Case, { foreignKey: 'lawyer_id', as: 'cases' });
        Lawyer.hasMany(db.Review, { foreignKey: 'lawyer_id', as: 'reviews' });
        Lawyer.hasMany(db.Payment, { foreignKey: 'lawyer_id', as: 'payments' });
        Lawyer.belongsTo(db.State, { foreignKey: 'state_id', as: 'state' });
        Lawyer.belongsTo(db.City, { foreignKey: 'city_id', as: 'cityRef' });
        Lawyer.belongsToMany(db.PracticeArea, {
            through: db.LawyerPracticeArea,
            foreignKey: 'lawyer_id',
            otherKey: 'practice_area_id',
            as: 'practiceAreas',
        });
        Lawyer.hasMany(db.VerificationDocument, { foreignKey: 'lawyer_id', as: 'verificationDocuments' });
        Lawyer.hasMany(db.Subscription, { foreignKey: 'lawyer_id', as: 'subscriptions' });
    };

    return Lawyer;
};
