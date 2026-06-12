module.exports = function (sequelize, DataTypes) {
    // Directed, typed edge in the glossary graph. Powers "See also" + internal linking.
    return sequelize.define('glossary_relations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        term_id: { type: DataTypes.UUID, allowNull: false },
        related_id: { type: DataTypes.UUID, allowNull: false },
        relation: {
            type: DataTypes.STRING(24),
            allowNull: false,
            defaultValue: 'related',
            validate: { isIn: [['related', 'prerequisite', 'contrast', 'broader', 'narrower']] },
        },
    }, {
        tableName: 'glossary_relations',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['term_id', 'related_id', 'relation'] },
            { fields: ['term_id'] },
        ],
    });
};
