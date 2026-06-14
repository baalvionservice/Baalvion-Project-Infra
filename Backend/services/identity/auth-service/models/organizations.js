module.exports = function (sequelize, DataTypes) {
    return sequelize.define('organizations', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        name: { type: DataTypes.STRING(255), allowNull: false },
        slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        // Trade-network classification — drives dashboard access on the frontend.
        // One of: buyer | seller | trade_agent | logistics_provider | customs_authority |
        //         bank | insurance_provider | compliance_agency | regulator | platform_owner
        type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'buyer' },
        plan: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'free' },
        // Lifecycle: 'active' | 'suspended'. A suspended org cannot operate; its members are
        // denied login (status check happens against the org, not just the user).
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },
        // Rich profile captured at platform onboarding (all optional except name/slug/type).
        legal_name: { type: DataTypes.STRING(255), allowNull: true },
        display_name: { type: DataTypes.STRING(255), allowNull: true },
        country: { type: DataTypes.STRING(2), allowNull: true },         // ISO-3166-1 alpha-2
        jurisdiction: { type: DataTypes.STRING(120), allowNull: true },  // regulatory jurisdiction
        contact_email: { type: DataTypes.STRING(255), allowNull: true },
        contact_phone: { type: DataTypes.STRING(40), allowNull: true },
        // Nullable: platform-created orgs exist before their first human owner accepts an invite.
        owner_id: { type: DataTypes.BIGINT, allowNull: true },
    }, {
        sequelize,
        tableName: 'organizations',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['slug'] },
            { fields: ['owner_id'] },
            { fields: ['type'] },
            { fields: ['status'] },
        ],
    });
};
