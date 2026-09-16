'use strict';

// Auto-publish with a veto window.
//
// The desk model is: the machine gates decide whether an article is *eligible*,
// a timer decides *when*, and a human can veto at any point before it fires.
// Only a draft that passed every gate ever gets a timer -- anything with a failed
// similarity check, an uncited claim, an unverified quote or a policy violation
// waits for a person indefinitely. The timer is for the routine majority, not
// for the cases that need judgement.
//
// This supersedes cms_editorial_charters.auto_publish, added in 20260034 with a
// comment asserting there was no auto-publish path. There is one now, and it
// belongs here rather than on the charter: when a site publishes is an operating
// rule, alongside the windows and caps it has to obey. The old column is dropped
// rather than left shadowing this one -- it was never written to or read.
module.exports = {
    async up(queryInterface, Sequelize) {
        const policy = { tableName: 'cms_publication_policies', schema: 'cms' };

        // Off by default, deliberately. A desk should watch its own output for a
        // while before letting it publish itself.
        await queryInterface.addColumn(policy, 'auto_publish_enabled', {
            type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
        });
        // The veto window: how long a gate-passing draft sits, notified, before it
        // goes out on its own.
        await queryInterface.addColumn(policy, 'auto_publish_delay_minutes', {
            type: Sequelize.INTEGER, allowNull: false, defaultValue: 10,
        });
        // Where the "articles are ready" digest goes. Empty = no mail is sent, and
        // (because a silent auto-publish is indefensible) no timer is armed either.
        await queryInterface.addColumn(policy, 'notify_emails', {
            type: Sequelize.JSONB, allowNull: false, defaultValue: [],
        });
        // What a fired timer does when the policy says "not now": 'requeue' holds
        // the article and re-arms for the next moment the policy allows, so caps
        // and publishing windows stay real rules rather than advisory ones.
        await queryInterface.addColumn(policy, 'on_timer_conflict', {
            type: Sequelize.STRING(24), allowNull: false, defaultValue: 'requeue',
        });

        await queryInterface.removeColumn({ tableName: 'cms_editorial_charters', schema: 'cms' }, 'auto_publish');
    },

    async down(queryInterface, Sequelize) {
        const policy = { tableName: 'cms_publication_policies', schema: 'cms' };
        await queryInterface.addColumn({ tableName: 'cms_editorial_charters', schema: 'cms' }, 'auto_publish', {
            type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
        });
        for (const col of ['on_timer_conflict', 'notify_emails', 'auto_publish_delay_minutes', 'auto_publish_enabled']) {
            await queryInterface.removeColumn(policy, col);
        }
    },
};
