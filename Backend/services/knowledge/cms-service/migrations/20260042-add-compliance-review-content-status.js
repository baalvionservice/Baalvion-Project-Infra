'use strict';

// 'compliance_review' has been a live value in the CmsContent model's status enum
// (see models/cmsContent.js) and in workflowService's TRANSITIONS map (the
// submit_for_compliance / compliance_approve / compliance_reject actions) since it
// landed in the 2026-06-12 "sync local working snapshot" commit — but no migration
// ever added it to the actual Postgres enum type. Every query that references this
// value (e.g. websiteService.getStats's pending-review count, which matches
// ['pending_review', 'compliance_review']) has been throwing
// "invalid input value for enum cms.enum_cms_contents_status" ever since, and any
// attempt to actually transition content into compliance review would fail the
// same way. This migration only adds the missing enum label; it changes no rows.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            "ALTER TYPE cms.enum_cms_contents_status ADD VALUE IF NOT EXISTS 'compliance_review';"
        );
    },
    // Postgres has no DROP VALUE for enum types. Reverting would require rebuilding
    // the type and every dependent column/index, and only makes sense paired with
    // rolling back the compliance-review workflow feature itself — left as a no-op.
    async down() {},
};
