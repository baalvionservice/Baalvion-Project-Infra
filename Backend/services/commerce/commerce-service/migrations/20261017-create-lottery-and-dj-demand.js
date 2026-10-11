'use strict';
/**
 * Club engagement, paid in points from the member's wallet:
 *  - Draws: an admin opens a draw with a prize, an entry price (0 allowed), a close time and a number of winners.
 *    Members buy entries; an admin runs the draw once; the random seed is stored so the order can be re-checked.
 *  - DJ demands: members propose a DJ for a club, an admin opens it, members pledge points. Confirmed pledges are
 *    kept; if the demand is closed without being booked, every held pledge goes back to the wallet.
 * Every movement of points is a row in commerce_points_ledger (one row per reference and reason).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const S = { schema: 'commerce' };
        const ref = (table) => ({ model: { tableName: table, schema: 'commerce' }, key: 'id' });
        await queryInterface.createTable('commerce_lottery_draws', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            title: { type: Sequelize.STRING(160), allowNull: false },
            prize: { type: Sequelize.TEXT, allowNull: false },
            entry_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            max_entries_per_user: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
            winners_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            closes_at: { type: Sequelize.DATE, allowNull: false },
            // draft -> open -> closed -> drawn ; cancelled refunds every entry
            status: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'draft' },
            drawn_at: { type: Sequelize.DATE, allowNull: true },
            draw_seed: { type: Sequelize.STRING(128), allowNull: true },
            created_by: { type: Sequelize.BIGINT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.createTable('commerce_lottery_entries', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            draw_id: { type: Sequelize.UUID, allowNull: false, references: ref('commerce_lottery_draws'), onDelete: 'CASCADE' },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            ticket_no: { type: Sequelize.INTEGER, allowNull: false },
            points_paid: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'active' }, // active | refunded
            won: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            win_position: { type: Sequelize.INTEGER, allowNull: true },
            claimed_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_lottery_entries', ['draw_id', 'user_id']);
        await queryInterface.sequelize.query('CREATE UNIQUE INDEX commerce_lottery_ticket_uq ON commerce.commerce_lottery_entries (draw_id, ticket_no)');

        await queryInterface.createTable('commerce_dj_demands', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            dj_name: { type: Sequelize.STRING(120), allowNull: false },
            genre: { type: Sequelize.STRING(60), allowNull: true },
            club_name: { type: Sequelize.STRING(160), allowNull: false },
            city: { type: Sequelize.STRING(80), allowNull: false },
            state: { type: Sequelize.STRING(80), allowNull: true },
            note: { type: Sequelize.TEXT, allowNull: true },
            target_points: { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 },
            // pending (proposed) -> open -> confirmed | closed ; rejected
            status: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'pending' },
            proposed_by: { type: Sequelize.BIGINT, allowNull: false },
            closes_at: { type: Sequelize.DATE, allowNull: true },
            decided_by: { type: Sequelize.BIGINT, allowNull: true },
            decided_at: { type: Sequelize.DATE, allowNull: true },
            decision_note: { type: Sequelize.TEXT, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_dj_demands', ['status']);
        await queryInterface.createTable('commerce_dj_pledges', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            demand_id: { type: Sequelize.UUID, allowNull: false, references: ref('commerce_dj_demands'), onDelete: 'CASCADE' },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            points: { type: Sequelize.BIGINT, allowNull: false },
            status: { type: Sequelize.STRING(10), allowNull: false, defaultValue: 'held' }, // held | refunded | applied
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, S);
        await queryInterface.addIndex('commerce.commerce_dj_pledges', ['demand_id', 'status']);
        await queryInterface.addIndex('commerce.commerce_dj_pledges', ['user_id']);
    },
    async down(queryInterface) {
        for (const t of ['commerce_dj_pledges', 'commerce_dj_demands', 'commerce_lottery_entries', 'commerce_lottery_draws']) {
            await queryInterface.dropTable({ tableName: t, schema: 'commerce' });
        }
    },
};
