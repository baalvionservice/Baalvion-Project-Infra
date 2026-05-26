'use strict';
const { Queue, Worker } = require('bullmq');
const config = require('../config/appConfig');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
};

const productQueue = new Queue('commerce-products', { connection });

let worker = null;

function startProductWorker() {
    worker = new Worker('commerce-products', async (job) => {
        const { CommerceProduct } = require('../models');
        const cache = require('../service/cacheService');

        if (job.name === 'scheduled-publish') {
            const { productId, storeId } = job.data;
            const product = await CommerceProduct.findOne({ where: { id: productId, storeId, status: 'scheduled' } });
            if (!product) return;
            await product.update({ status: 'published', publishedAt: new Date() });
            await cache.del(cache.keys.product(productId));
            console.log(`[ProductQueue] Auto-published product ${productId}`);
        }
    }, { connection });

    worker.on('failed', (job, err) => console.error(`[ProductQueue] Job ${job?.id} failed:`, err.message));
    worker.on('completed', (job) => console.log(`[ProductQueue] Job ${job.id} completed`));
}

async function scheduleProductPublish(productId, storeId, publishAt) {
    const delay = new Date(publishAt).getTime() - Date.now();
    if (delay <= 0) throw new Error('publishAt must be in the future');
    const job = await productQueue.add('scheduled-publish', { productId, storeId }, {
        delay, jobId: `publish:${productId}`, removeOnComplete: true, removeOnFail: false,
    });
    return job.id;
}

async function cancelScheduledPublish(productId) {
    const job = await productQueue.getJob(`publish:${productId}`);
    if (job) await job.remove();
}

module.exports = { productQueue, startProductWorker, scheduleProductPublish, cancelScheduledPublish };
