'use strict';
module.exports = (sequelize, DataTypes) => {
    const PersonPhoto = sequelize.define('PersonPhoto', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        person_id: { type: DataTypes.INTEGER, allowNull: false },
        content_type: { type: DataTypes.STRING(40), allowNull: false },
        data: { type: DataTypes.BLOB, allowNull: false },
        width: DataTypes.INTEGER,
        height: DataTypes.INTEGER,
        sha256: { type: DataTypes.STRING(64), allowNull: false },
        alt_text: DataTypes.STRING(300),
        credit: { type: DataTypes.STRING(500), allowNull: false },
        license: { type: DataTypes.STRING(60), allowNull: false },
        license_url: DataTypes.STRING(500),
        source_url: DataTypes.STRING(500),
        is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal',
        tableName: 'person_photos',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        // Listings never carry the image bytes; scope('withData') is for the one route that serves them.
        defaultScope: { attributes: { exclude: ['data'] } },
        scopes: { withData: {} },
    });

    PersonPhoto.associate = (db) => {
        PersonPhoto.belongsTo(db.Person, { as: 'person', foreignKey: 'person_id' });
    };
    return PersonPhoto;
};
