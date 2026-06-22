'use strict';
// Inbound IR contact messages — what anyone submits via the public "Contact Investor Relations"
// form. Distinct from `ir_contacts` (which is the OUTBOUND directory of IR staff to reach).
module.exports = (sequelize, DataTypes) => {
    const IrContactMessage = sequelize.define('IrContactMessage', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        org_id: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        email: { type: DataTypes.STRING(255), allowNull: false },
        company: { type: DataTypes.STRING(300) },
        inquiry_type: { type: DataTypes.STRING(60) },
        subject: { type: DataTypes.STRING(300) },
        message: { type: DataTypes.TEXT, allowNull: false },
        // 'new' | 'read' | 'archived' — validated at the schema layer (VARCHAR, not a pg enum).
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new' },
        source: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'contact_form' },
        ip: { type: DataTypes.STRING(64) },
    }, {
        schema: 'ir',
        tableName: 'ir_contact_messages',
        underscored: true,
        timestamps: true,
    });
    return IrContactMessage;
};
