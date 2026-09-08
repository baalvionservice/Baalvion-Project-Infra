'use strict';

// Two columns that stop the pipeline publishing into nothing.
//
// output_content_type — a site's pipeline produces one kind of thing.
// Imperialpedia's wire pipeline is a NEWS desk: its output is contentType
// 'news', which routes to /world/<region>/... Guides ('article') are explicitly
// out of scope there, because Imperialpedia's evergreen guide tree was retired.
//
// dead_category_slugs — categories that still exist in cms_categories but whose
// public route no longer resolves. Imperialpedia's AdSense cleanup permanently
// redirected 66 category routes to the homepage while leaving every one of those
// categories in the CMS, so the admin panel will happily file and publish an
// article into a 308. Confirmed live: all four Imperialpedia CMS articles are
// unreachable (three redirect to '/', one 404s). Populated by
// scripts/verify-publish-routes.cjs, which probes the real site rather than
// duplicating the frontend's redirect table here.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_editorial_charters', schema: 'cms' },
            'output_content_type',
            { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'news' }
        );
        await queryInterface.addColumn(
            { tableName: 'cms_publication_policies', schema: 'cms' },
            'dead_category_slugs',
            { type: Sequelize.JSONB, allowNull: false, defaultValue: [] }
        );
        await queryInterface.addColumn(
            { tableName: 'cms_publication_policies', schema: 'cms' },
            'routes_verified_at',
            { type: Sequelize.DATE, allowNull: true }
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn({ tableName: 'cms_editorial_charters', schema: 'cms' }, 'output_content_type');
        await queryInterface.removeColumn({ tableName: 'cms_publication_policies', schema: 'cms' }, 'dead_category_slugs');
        await queryInterface.removeColumn({ tableName: 'cms_publication_policies', schema: 'cms' }, 'routes_verified_at');
    },
};
