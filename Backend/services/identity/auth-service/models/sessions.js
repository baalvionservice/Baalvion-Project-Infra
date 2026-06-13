module.exports = function (sequelize, DataTypes) {
    return sequelize.define('sessions', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
        user_id: { type: DataTypes.BIGINT, allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: true },
        ip_address: { type: DataTypes.STRING(45), allowNull: true },
        user_agent: { type: DataTypes.TEXT, allowNull: true },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        last_seen_at: { type: DataTypes.DATE, allowNull: true },
        revoked_at: { type: DataTypes.DATE, allowNull: true },

        // ── Session enrichment + unified-lifecycle fields (migration 008a) ──────────
        // Declared so the ORM can read/write them; sync({alter:false}) means these never
        // alter the DB — migration 008a owns the schema. All nullable: nothing populates
        // them yet (Phase 2 wires the enrichment write-path). Types match the live columns.
        refresh_family_id:  { type: DataTypes.UUID, allowNull: true },
        revoked_reason:     { type: DataTypes.STRING(48), allowNull: true },
        last_seen_ip:       { type: DataTypes.STRING(45), allowNull: true },

        geo_country:        { type: DataTypes.STRING(2),   allowNull: true },
        geo_region:         { type: DataTypes.STRING(100), allowNull: true },
        geo_city:           { type: DataTypes.STRING(100), allowNull: true },
        geo_lat:            { type: DataTypes.DOUBLE,      allowNull: true },
        geo_lon:            { type: DataTypes.DOUBLE,      allowNull: true },
        geo_timezone:       { type: DataTypes.STRING(50),  allowNull: true },
        geo_source:         { type: DataTypes.STRING(24),  allowNull: true },

        device_browser:     { type: DataTypes.STRING(100), allowNull: true },
        device_os:          { type: DataTypes.STRING(100), allowNull: true },
        device_type:        { type: DataTypes.STRING(20),  allowNull: true },
        device_fingerprint: { type: DataTypes.STRING(16),  allowNull: true },
        ua_hash:            { type: DataTypes.STRING(64),  allowNull: true },
        ip_hash:            { type: DataTypes.STRING(64),  allowNull: true },

        risk_score:         { type: DataTypes.SMALLINT,    allowNull: true },
        risk_level:         { type: DataTypes.STRING(10),  allowNull: true },
        risk_signals:       { type: DataTypes.JSONB,       allowNull: true },

        csrf_token:         { type: DataTypes.STRING(64),  allowNull: true },
        step_up_level:      { type: DataTypes.STRING(16),  allowNull: true },
        step_up_expires_at: { type: DataTypes.DATE,        allowNull: true },

        source:             { type: DataTypes.STRING(24),  allowNull: true },
        issued_by:          { type: DataTypes.STRING(48),  allowNull: true },
    }, {
        sequelize,
        tableName: 'sessions',
        schema: 'auth',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['expires_at'] },
        ],
    });
};
