package com.baalvion.tradefinance.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka wiring for the trade-finance service.
 *
 * JSON-string wire format with an idempotent producer used by the transactional outbox publisher,
 * plus declarations of the topics this service owns ({@code <domain>.<entity>.<event>}). The admin
 * client creates any missing topics on startup. No consumer factory: this service only produces.
 */
@Configuration
public class KafkaConfig {

  @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
  private String bootstrapServers;

  @Bean
  public ProducerFactory<String, String> producerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.ACKS_CONFIG, "all");
    props.put(ProducerConfig.RETRIES_CONFIG, 3);
    props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
    props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
    props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
    props.put(ProducerConfig.BATCH_SIZE_CONFIG, 32768);
    return new DefaultKafkaProducerFactory<>(props);
  }

  @Bean
  public KafkaTemplate<String, String> kafkaTemplate() {
    return new KafkaTemplate<>(producerFactory());
  }

  @Bean NewTopic lcIssuedTopic()    { return TopicBuilder.name("tradefinance.lc.issued").partitions(6).replicas(1).build(); }
  @Bean NewTopic lcAmendedTopic()   { return TopicBuilder.name("tradefinance.lc.amended").partitions(6).replicas(1).build(); }
  @Bean NewTopic lcPresentedTopic() { return TopicBuilder.name("tradefinance.lc.presented").partitions(6).replicas(1).build(); }
  @Bean NewTopic lcSettledTopic()   { return TopicBuilder.name("tradefinance.lc.settled").partitions(6).replicas(1).build(); }
  @Bean NewTopic lcClosedTopic()    { return TopicBuilder.name("tradefinance.lc.closed").partitions(6).replicas(1).build(); }
  @Bean NewTopic bgIssuedTopic()    { return TopicBuilder.name("tradefinance.guarantee.issued").partitions(6).replicas(1).build(); }
  @Bean NewTopic bgClaimedTopic()   { return TopicBuilder.name("tradefinance.guarantee.claimed").partitions(6).replicas(1).build(); }
  @Bean NewTopic bgClaimPaidTopic() { return TopicBuilder.name("tradefinance.guarantee.claim_paid").partitions(6).replicas(1).build(); }
  @Bean NewTopic bgClosedTopic()    { return TopicBuilder.name("tradefinance.guarantee.closed").partitions(6).replicas(1).build(); }
}
