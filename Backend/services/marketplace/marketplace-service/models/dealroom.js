'use strict';
// Deal-room domain models (Phases 3–5). Defined together since they share the same
// timestamp conventions (most tables carry only created_at, or none — managed by DB
// defaults), and registered onto `db` by models/index.js.
module.exports = (sequelize, DataTypes) => {
    const opts = (tableName, timestamps = false) => ({ schema: 'marketplace', tableName, underscored: true, timestamps });

    const DealMember = sequelize.define('DealMember', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        user_id: { type: DataTypes.STRING(120), allowNull: false },
        org_id: { type: DataTypes.UUID, allowNull: false },
        role: { type: DataTypes.STRING(20), defaultValue: 'participant' },
    }, opts('deal_members'));

    const DealMessage = sequelize.define('DealMessage', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        sender_id: { type: DataTypes.STRING(120), allowNull: false },
        body: { type: DataTypes.TEXT },
        attachments_json: { type: DataTypes.JSONB, defaultValue: [] },
        kind: { type: DataTypes.STRING(10), defaultValue: 'chat' },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('deal_messages'));

    const NdaAgreement = sequelize.define('NdaAgreement', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        party_org_id: { type: DataTypes.UUID, allowNull: false },
        template_id: { type: DataTypes.STRING(120) },
        status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
        signed_at: { type: DataTypes.DATE },
        signature_ref: { type: DataTypes.STRING(200) },
    }, opts('nda_agreements'));

    const DocumentRequest = sequelize.define('DocumentRequest', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        category: { type: DataTypes.STRING(20), allowNull: false },
        title: { type: DataTypes.STRING(300), allowNull: false },
        status: { type: DataTypes.STRING(20), defaultValue: 'requested' },
        requested_by: { type: DataTypes.STRING(120) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('document_requests'));

    const DataRoomDocument = sequelize.define('DataRoomDocument', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        document_request_id: { type: DataTypes.UUID },
        file_url: { type: DataTypes.STRING(600), allowNull: false },
        version: { type: DataTypes.INTEGER, defaultValue: 1 },
        uploaded_by: { type: DataTypes.STRING(120) },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('data_room_documents'));

    const DocumentAccessGrant = sequelize.define('DocumentAccessGrant', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        document_id: { type: DataTypes.UUID },
        category: { type: DataTypes.STRING(20) },
        grantee_org_id: { type: DataTypes.UUID, allowNull: false },
        condition: { type: DataTypes.STRING(20), defaultValue: 'nda' },
        granted_by: { type: DataTypes.STRING(120) },
        expires_at: { type: DataTypes.DATE },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('document_access_grants'));

    const DueDiligenceItem = sequelize.define('DueDiligenceItem', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        category: { type: DataTypes.STRING(20), allowNull: false },
        item: { type: DataTypes.STRING(300), allowNull: false },
        status: { type: DataTypes.STRING(20), defaultValue: 'open' },
        owner: { type: DataTypes.STRING(120) },
        evidence_url: { type: DataTypes.STRING(600) },
    }, opts('due_diligence_items'));

    const TermSheet = sequelize.define('TermSheet', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        current_version: { type: DataTypes.INTEGER, defaultValue: 1 },
        status: { type: DataTypes.STRING(20), defaultValue: 'draft' },
    }, opts('term_sheets', true));

    const TermSheetVersion = sequelize.define('TermSheetVersion', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        term_sheet_id: { type: DataTypes.UUID, allowNull: false },
        version: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(20, 2) },
        equity_pct: { type: DataTypes.DECIMAL(6, 3) },
        valuation: { type: DataTypes.DECIMAL(20, 2) },
        board_rights_json: { type: DataTypes.JSONB, defaultValue: {} },
        investor_rights_json: { type: DataTypes.JSONB, defaultValue: {} },
        exit_rights_json: { type: DataTypes.JSONB, defaultValue: {} },
        author_org_id: { type: DataTypes.UUID, allowNull: false },
        action: { type: DataTypes.STRING(20), allowNull: false },
        note: { type: DataTypes.TEXT },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('term_sheet_versions'));

    const Signature = sequelize.define('Signature', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        document_type: { type: DataTypes.STRING(20), allowNull: false },
        provider: { type: DataTypes.STRING(20), allowNull: false },
        envelope_id: { type: DataTypes.STRING(200) },
        signer_id: { type: DataTypes.STRING(120) },
        status: { type: DataTypes.STRING(20), defaultValue: 'sent' },
        signed_at: { type: DataTypes.DATE },
        audit_url: { type: DataTypes.STRING(600) },
    }, opts('signatures'));

    const EscrowTransaction = sequelize.define('EscrowTransaction', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        deal_id: { type: DataTypes.UUID, allowNull: false },
        escrow_ref: { type: DataTypes.STRING(200) },
        amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
        status: { type: DataTypes.STRING(20), defaultValue: 'initiated' },
        release_conditions_json: { type: DataTypes.JSONB, defaultValue: {} },
    }, opts('escrow_transactions', true));

    const CapTableEntry = sequelize.define('CapTableEntry', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        company_id: { type: DataTypes.UUID, allowNull: false },
        holder_type: { type: DataTypes.STRING(20), allowNull: false },
        holder_id: { type: DataTypes.STRING(120) },
        security_type: { type: DataTypes.STRING(20), defaultValue: 'equity' },
        shares: { type: DataTypes.DECIMAL(20, 4) },
        ownership_pct: { type: DataTypes.DECIMAL(7, 4) },
        as_of: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    }, opts('cap_table_entries'));

    const CapTableEvent = sequelize.define('CapTableEvent', {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        company_id: { type: DataTypes.UUID, allowNull: false },
        deal_id: { type: DataTypes.UUID },
        event: { type: DataTypes.STRING(20), allowNull: false },
        delta_json: { type: DataTypes.JSONB, defaultValue: {} },
        effective_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, opts('cap_table_events'));

    return { DealMember, DealMessage, NdaAgreement, DocumentRequest, DataRoomDocument, DocumentAccessGrant, DueDiligenceItem, TermSheet, TermSheetVersion, Signature, EscrowTransaction, CapTableEntry, CapTableEvent };
};
