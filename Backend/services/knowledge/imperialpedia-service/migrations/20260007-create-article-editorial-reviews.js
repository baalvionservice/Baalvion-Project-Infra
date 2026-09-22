'use strict';

// PROMPT 5 — Human-Vetted Publishing Workflow. One row per completed human review/approval
// action (never per keystroke or per audit run — those stay client-side/session state). Kept
// intentionally small: no article title/body/full-audit-output/provider-secrets duplication,
// just enough to answer "who approved what version, and what did the audit show them at the
// time" (see editorialReviewService.js for how this is read back).
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        await queryInterface.createTable(
            { tableName: 'article_editorial_reviews', schema: 'imperialpedia' },
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                article_id: { type: Sequelize.INTEGER, allowNull: false },
                reviewer_user_id: { type: Sequelize.INTEGER, allowNull: false },
                // djb2 hash of title+content at the moment the reviewed audit was generated —
                // same contentFingerprint() the Prompt 4 audit already returns to the client
                // (editorialAuditService.js). Compared against the article's CURRENT fingerprint
                // to detect a stale/edited-since-approval review.
                reviewed_fingerprint: { type: Sequelize.STRING(32), allowNull: false },
                audit_status_at_review: { type: Sequelize.STRING(50), allowNull: true },
                critical_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                warning_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                suggestion_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
                // { [checklistItemId]: true } for every Prompt 4 HUMAN_REVIEW_CHECKLIST item —
                // never auto-checked from the audit, always explicit reviewer acknowledgement.
                checklist_state: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
                reviewer_note: { type: Sequelize.TEXT, allowNull: true },
                // True whenever critical_count > 0 at approval time and the reviewer explicitly
                // confirmed they reviewed those critical items (spec §6/§7) — never silently
                // defaulted to true.
                acknowledged_critical: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
                approved_for_publication: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
                approved_at: { type: Sequelize.DATE, allowNull: true },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            }
        );
        await queryInterface.addIndex(
            { tableName: 'article_editorial_reviews', schema: 'imperialpedia' },
            ['article_id']
        );
        await queryInterface.addIndex(
            { tableName: 'article_editorial_reviews', schema: 'imperialpedia' },
            ['reviewer_user_id']
        );
        await queryInterface.addIndex(
            { tableName: 'article_editorial_reviews', schema: 'imperialpedia' },
            ['created_at']
        );
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'article_editorial_reviews', schema: 'imperialpedia' });
    },
};
