'use strict';
module.exports = (sequelize, DataTypes) => {
    const Person = sequelize.define('Person', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        full_name: { type: DataTypes.STRING(300), allowNull: false },
        display_name: DataTypes.STRING(300),
        category: { type: DataTypes.STRING(40), allowNull: false },
        country_code: DataTypes.STRING(2),
        status: { type: DataTypes.STRING(20), defaultValue: 'active' },
        birth_date: DataTypes.STRING(20),
        birth_place: DataTypes.STRING(300),
        death_date: DataTypes.STRING(20),
        short_bio: DataTypes.TEXT,
        biography: DataTypes.TEXT,
        career: { type: DataTypes.JSONB, defaultValue: [] },
        education: { type: DataTypes.JSONB, defaultValue: [] },
        awards: { type: DataTypes.JSONB, defaultValue: [] },
        notable_works: { type: DataTypes.JSONB, defaultValue: [] },
        timeline: { type: DataTypes.JSONB, defaultValue: [] },
        social: { type: DataTypes.JSONB, defaultValue: {} },
        sports_info: { type: DataTypes.JSONB, defaultValue: {} },
        official_website: DataTypes.STRING(500),
        sources: { type: DataTypes.JSONB, defaultValue: [] },
        wikidata_id: DataTypes.STRING(20),
        seo_title: DataTypes.STRING(200),
        seo_description: DataTypes.STRING(400),
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        source_note: DataTypes.TEXT,
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
        last_reviewed_at: DataTypes.DATE,
    }, { schema: 'legal', tableName: 'people', underscored: true, timestamps: true });

    Person.associate = (db) => {
        Person.hasMany(db.PersonPhoto, { as: 'photos', foreignKey: 'person_id' });
        Person.hasMany(db.PersonLink, { as: 'links', foreignKey: 'person_id' });
    };
    return Person;
};
