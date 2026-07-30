'use strict';
module.exports = (sequelize, DataTypes) => {
    const CaseNote = sequelize.define('CaseNote', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        case_id: { type: DataTypes.INTEGER, allowNull: false },
        author_id: { type: DataTypes.INTEGER, allowNull: false },
        text: { type: DataTypes.TEXT, allowNull: false },
        tags: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        is_private: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal',
        tableName: 'case_notes',
        underscored: true,
        timestamps: true,
    });

    CaseNote.associate = (db) => {
        CaseNote.belongsTo(db.Case, { foreignKey: 'case_id', as: 'case' });
        CaseNote.belongsTo(db.User, { foreignKey: 'author_id', as: 'author' });
    };

    return CaseNote;
};
