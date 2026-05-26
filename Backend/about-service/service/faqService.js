'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listFaqs = async ({ category }) => {
    const where = { is_active: true };
    if (category) where.category = category;
    const faqs = await db.Faq.findAll({
        where,
        order: [['category', 'ASC'], ['order_index', 'ASC']],
    });

    // Group by category
    const grouped = faqs.reduce((acc, faq) => {
        const cat = faq.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(faq);
        return acc;
    }, {});

    return { faqs, grouped };
};

const createFaq = async (data) => {
    return db.Faq.create(data);
};

const getFaq = async (id) => {
    const faq = await db.Faq.findByPk(id);
    if (!faq) throw new AppError('NOT_FOUND', 'FAQ not found', 404);
    return faq;
};

const updateFaq = async (id, data) => {
    const faq = await db.Faq.findByPk(id);
    if (!faq) throw new AppError('NOT_FOUND', 'FAQ not found', 404);
    await faq.update(data);
    return faq;
};

const deleteFaq = async (id) => {
    const faq = await db.Faq.findByPk(id);
    if (!faq) throw new AppError('NOT_FOUND', 'FAQ not found', 404);
    await faq.destroy();
};

const markHelpful = async (id) => {
    const faq = await db.Faq.findByPk(id);
    if (!faq) throw new AppError('NOT_FOUND', 'FAQ not found', 404);
    await faq.increment('helpful_count');
    await faq.reload();
    return { id: faq.id, helpful_count: faq.helpful_count };
};

module.exports = { listFaqs, createFaq, getFaq, updateFaq, deleteFaq, markHelpful };
