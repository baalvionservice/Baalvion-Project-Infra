/**
 * EXAMPLE — Node-side bridge that turns JVM Kafka saga events into PCL events.
 *
 * The Java payment-service keeps emitting its saga topics (payments.transaction.completed /
 * .failed / .reversed, payments.settlement.processed) via its existing OutboxPublisher.
 * This consumer is the ONLY thing that translates them into charge-state transitions — the
 * Java PaymentSagaListener no longer writes gateway charge state.
 *
 * Exactly-once: the consumer's offset commit + PCL's inbox dedupe make redelivery safe.
 */
import { normalizeSagaEvent } from '@baalvion/payment-consistency';

const SAGA_TOPICS = [
  'payments.transaction.completed',
  'payments.transaction.failed',
  'payments.transaction.reversed',
  'payments.settlement.processed',
];

/**
 * @param {object} deps { kafka, pcl, logger }  kafka = kafkajs instance; pcl = PaymentStateMachine
 */
export async function startSagaBridge({ kafka, pcl, logger }) {
  const consumer = kafka.consumer({ groupId: 'pcl-saga-bridge' });
  await consumer.connect();
  await consumer.subscribe({ topics: SAGA_TOPICS, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const body = JSON.parse(message.value.toString());
      const event = normalizeSagaEvent({
        topic,
        paymentId: body.gatewayPaymentId ?? body.transactionId, // charge grain
        provider: body.provider ?? 'internal',
        transactionId: body.transactionId ?? body.eventId,
        money: { amountMinor: body.amountMinor, currency: body.currency },
        orgId: body.websiteSlug ?? body.tenantId,
        occurredAt: body.occurredAt,
      });
      if (!event) return; // topic we don't map → skip (offset still advances)
      const outcome = await pcl.apply(event);
      logger.info({ topic, paymentId: event.paymentId, result: outcome.result }, 'saga → pcl');
    },
  });

  return { stop: () => consumer.disconnect() };
}
