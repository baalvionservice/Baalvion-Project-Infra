'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listContacts = async (orgId) => {
    return db.IrContact.findAll({
        where: { org_id: orgId, is_active: true },
        order: [['is_primary', 'DESC'], ['name', 'ASC']],
    });
};

const createContact = async (orgId, data) => {
    return db.IrContact.create({ ...data, org_id: orgId });
};

const updateContact = async (id, orgId, data) => {
    const contact = await db.IrContact.findOne({ where: { id, org_id: orgId } });
    if (!contact) throw new AppError('NOT_FOUND', 'Contact not found', 404);
    await contact.update(data);
    return contact;
};

const deleteContact = async (id, orgId) => {
    const contact = await db.IrContact.findOne({ where: { id, org_id: orgId } });
    if (!contact) throw new AppError('NOT_FOUND', 'Contact not found', 404);
    await contact.destroy();
};

module.exports = { listContacts, createContact, updateContact, deleteContact };
