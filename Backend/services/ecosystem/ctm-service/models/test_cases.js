'use strict';
const { DataTypes } = require('sequelize');

// Automated test-case results for a submission. Populated by the sandbox runner
// (Judge0 adapter) when configured; otherwise rows can be authored manually.
module.exports = (sequelize) => sequelize.define('test_cases', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    submission_id:    { type: DataTypes.UUID, allowNull: false },
    name:             { type: DataTypes.STRING(200), allowNull: false },
    description:      { type: DataTypes.TEXT },
    expected_outcome: { type: DataTypes.TEXT },
    actual_outcome:   { type: DataTypes.TEXT },
    status:           { type: DataTypes.ENUM('Passed', 'Failed', 'Warning', 'Pending'), defaultValue: 'Pending' },
    runtime_ms:       { type: DataTypes.INTEGER },
    metadata:         { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'test_cases' });
