const { Kafka } = require('kafkajs');
const config = require('../config/appConfig');

let kafka;
let producer;

/**
 * Kafka Service: Async event publishing for payment saga
 */

async function initProducer() {
  kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
  });

  producer = kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
    transactionTimeout: 30000,
  });

  await producer.connect();
  console.log('[kafka] Producer connected');
  return producer;
}

/**
 * Publish payment initiated event
 */
async function publishPaymentInitiated(transaction) {
  if (!producer) await initProducer();

  const event = {
    id: transaction.id,
    tenantId: transaction.tenantId,
    transactionRef: transaction.idempotencyKey,
    sourceAccountId: transaction.sourceAccountId,
    destinationAccountId: transaction.destinationAccountId,
    amount: transaction.amount,
    fee: transaction.fee,
    currency: transaction.currency,
    paymentScheme: transaction.paymentScheme,
    initiatedAt: transaction.initiatedAt,
    metadata: transaction.metadata,
  };

  await producer.send({
    topic: 'payments.transaction.initiated.v1',
    messages: [
      {
        key: transaction.tenantId,
        value: JSON.stringify(event),
        headers: {
          'trace-id': transaction.traceId,
          'tenant-id': transaction.tenantId,
          'timestamp': new Date().toISOString(),
        },
      },
    ],
  });

  console.log(`[kafka] Published payments.transaction.initiated for ${transaction.id}`);
}

/**
 * Publish payment completed event
 */
async function publishPaymentCompleted(transaction, ledgerJournalId) {
  if (!producer) await initProducer();

  const event = {
    id: transaction.id,
    tenantId: transaction.tenantId,
    transactionRef: transaction.idempotencyKey,
    ledgerJournalId,
    status: transaction.status,
    completedAt: transaction.completedAt,
    schemeRef: transaction.schemeRef,
  };

  await producer.send({
    topic: 'payments.transaction.completed.v1',
    messages: [
      {
        key: transaction.tenantId,
        value: JSON.stringify(event),
        headers: {
          'trace-id': transaction.traceId,
          'tenant-id': transaction.tenantId,
        },
      },
    ],
  });

  console.log(`[kafka] Published payments.transaction.completed for ${transaction.id}`);
}

/**
 * Publish payment failed event
 */
async function publishPaymentFailed(transaction) {
  if (!producer) await initProducer();

  const event = {
    id: transaction.id,
    tenantId: transaction.tenantId,
    transactionRef: transaction.idempotencyKey,
    status: transaction.status,
    failureCode: transaction.failureCode,
    failureReason: transaction.failureReason,
    failedAt: new Date().toISOString(),
  };

  await producer.send({
    topic: 'payments.transaction.failed.v1',
    messages: [
      {
        key: transaction.tenantId,
        value: JSON.stringify(event),
        headers: {
          'trace-id': transaction.traceId,
          'tenant-id': transaction.tenantId,
        },
      },
    ],
  });

  console.log(`[kafka] Published payments.transaction.failed for ${transaction.id}`);
}

module.exports = {
  initProducer,
  publishPaymentInitiated,
  publishPaymentCompleted,
  publishPaymentFailed,
};
