'use strict';
// Order invoice generation. Fires post-commit (fire-and-forget, fail-open) from orderService's
// payment-capture paths — an invoice-generation problem must never fail a payment. Renders a PDF
// with pdfkit (real dependency, same lazy-require guard report-service uses so a missing install
// degrades to NOT_IMPLEMENTED instead of a hard crash) and stores it in S3 via @baalvion/upload.
const crypto = require('crypto');
const { OrdersInvoice, OrdersOrder, OrdersCustomer } = require('../models');
const { AppError } = require('../utils/errors');
const ownership = require('./ownership');
const { putObject } = require('@baalvion/upload');

// An order is owned by the user behind its customer record (mirrors orderService.orderOwnerUserId).
async function orderOwnerUserId(customerId) {
    if (!customerId) return null;
    const c = await OrdersCustomer.findByPk(customerId, { attributes: ['userId'] });
    return c ? c.userId : null;
}

// The guest session (if any) an order is bound to (mirrors orderService.orderOwnerSessionId).
function orderOwnerSessionId(order) {
    const meta = order && order.metadata;
    return meta && typeof meta.guestSessionId === 'string' ? meta.guestSessionId : null;
}

function generateInvoiceNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `INV-${ts}-${rand}`;
}

function renderInvoicePdf(order, items) {
    let PDFDocument;
    try { PDFDocument = require('pdfkit'); }
    catch { throw new AppError('NOT_IMPLEMENTED', 'Invoice PDF generation requires the optional "pdfkit" dependency (pnpm add pdfkit)', 501); }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            doc.on('data', (d) => chunks.push(d));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const bill = order.billingAddress || {};
            const num = (v) => Number(v || 0).toFixed(2);

            doc.fontSize(18).text('Invoice', { align: 'right' });
            doc.fontSize(10).fillColor('#666').text(`Order ${order.orderNumber}`, { align: 'right' });
            doc.text(`Issued ${new Date().toISOString().slice(0, 10)}`, { align: 'right' }).fillColor('#000');
            doc.moveDown(1.5);

            if (bill.firstName || bill.lastName || bill.line1) {
                doc.fontSize(11).text('Billed to');
                doc.fontSize(10).fillColor('#333');
                if (bill.firstName || bill.lastName) doc.text(`${bill.firstName || ''} ${bill.lastName || ''}`.trim());
                if (bill.line1) doc.text(bill.line1);
                if (bill.line2) doc.text(bill.line2);
                if (bill.city || bill.state || bill.postalCode) doc.text(`${bill.city || ''}${bill.city && bill.state ? ', ' : ''}${bill.state || ''} ${bill.postalCode || ''}`.trim());
                if (bill.country) doc.text(bill.country);
                doc.fillColor('#000');
                doc.moveDown(1);
            }

            const colX = { name: 50, qty: 330, price: 400, total: 470 };
            const drawHeader = () => {
                const y = doc.y;
                doc.fontSize(9).fillColor('#666');
                doc.text('Item', colX.name, y);
                doc.text('Qty', colX.qty, y);
                doc.text('Price', colX.price, y);
                doc.text('Total', colX.total, y);
                doc.fillColor('#000');
                doc.moveDown(0.5);
                doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
                doc.moveDown(0.3);
            };
            drawHeader();
            doc.fontSize(10);
            for (const item of items) {
                if (doc.y > 700) { doc.addPage(); drawHeader(); doc.fontSize(10); }
                const y = doc.y;
                doc.text(item.name || item.sku || 'Item', colX.name, y, { width: 270 });
                doc.text(String(item.quantity), colX.qty, y);
                doc.text(num(item.price), colX.price, y);
                doc.text(num(item.total != null ? item.total : item.gross), colX.total, y);
                doc.moveDown(0.6);
            }
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
            doc.moveDown(0.5);
            doc.fontSize(12).text(`Total: ${num(order.totalAmount)} ${order.currencyCode || 'USD'}`, colX.price, doc.y, { align: 'left' });

            doc.end();
        } catch (err) { reject(err); }
    });
}

/**
 * Generate (or re-fetch, if already generated) the invoice for a paid order. Called post-commit
 * from orderService's payment-capture paths. Never throws into the caller.
 */
async function generateInvoiceForOrder(storeId, order, items) {
    try {
        const [invoice] = await OrdersInvoice.findOrCreate({
            where: { orderId: order.id },
            defaults: { orderId: order.id, invoiceNumber: generateInvoiceNumber(), status: 'draft' },
        });
        if (invoice.pdfUrl) return; // already generated (retry/replay of the same capture)

        const pdf = await renderInvoicePdf(order, items || []);
        const key = `invoices/${storeId}/${order.id}/${invoice.invoiceNumber}.pdf`;
        await putObject(key, pdf, 'application/pdf');
        await invoice.update({ pdfUrl: key, status: 'sent', sentAt: new Date() });
    } catch (err) {
        console.error(JSON.stringify({ evt: 'invoice.generation_failed', storeId, orderId: order && order.id, error: err.message }));
    }
}

/** Owner/guest/staff read of an order's invoice (IDOR-safe via ownership.enforce). */
async function getOrderInvoice(storeId, orderId, actor) {
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
    await ownership.enforce(actor, await orderOwnerUserId(order.customerId), { resourceType: 'order', resourceId: orderId, storeId, action: 'invoice.read', ownerSessionId: orderOwnerSessionId(order) });

    const invoice = await OrdersInvoice.findOne({ where: { orderId } });
    if (!invoice || !invoice.pdfUrl) throw new AppError('NOT_FOUND', 'Invoice not yet generated for this order', 404);
    return invoice.toJSON();
}

module.exports = { generateInvoiceForOrder, getOrderInvoice };
