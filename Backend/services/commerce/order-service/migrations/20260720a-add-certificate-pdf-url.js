'use strict';
// Certificates of authenticity are now rendered to a downloadable PDF at issuance (see
// consignmentService.issueCertificate). ADDITIVE + NULLABLE: existing certificate rows predate
// PDF generation and stay null; new issuances stamp this going forward.
const CERTIFICATES = { tableName: 'consignment_certificates', schema: 'orders' };

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(CERTIFICATES, 'pdf_url', {
            type: Sequelize.STRING(500), allowNull: true,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn(CERTIFICATES, 'pdf_url');
    },
};
