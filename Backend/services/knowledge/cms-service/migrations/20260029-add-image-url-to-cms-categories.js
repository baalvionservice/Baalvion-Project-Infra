'use strict';

// Categories had no way to carry their own photo — editors could only set an
// SEO "Open Graph" image (seoMetadata.ogImage, used for social share cards),
// not a real display image for the category/topic page itself or for
// frontend homepage sections that group articles by category. This adds a
// plain `image_url` column so a category can be assigned a real uploaded
// photo (via the admin Media Library) independent of its SEO metadata.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            { tableName: 'cms_categories', schema: 'cms' },
            'image_url',
            { type: Sequelize.TEXT, allowNull: true },
        );
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(
            { tableName: 'cms_categories', schema: 'cms' },
            'image_url',
        );
    },
};
