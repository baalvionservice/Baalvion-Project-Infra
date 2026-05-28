module.exports = function (sequelize, DataTypes) {
    return sequelize.define('calculator_results', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: true },
        calculator_type: { type: DataTypes.STRING(50), allowNull: false }, // compound_interest, retirement, loan, sip
        inputs: { type: DataTypes.JSONB, allowNull: false },
        results: { type: DataTypes.JSONB, allowNull: false },
    }, {
        tableName: 'calculator_results',
        schema: 'imperialpedia',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['calculator_type'] },
        ],
    });
};
