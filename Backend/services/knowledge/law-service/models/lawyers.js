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
        jurisdictions: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        experience: { type: DataTypes.INTEGER, defaultValue: 0 },
        hourly_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
        total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
        bio: { type: DataTypes.TEXT },
        profile_photo: { type: DataTypes.TEXT },
        languages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        availability: { type: DataTypes.JSONB, defaultValue: {} },
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
    };

    return Lawyer;
};
