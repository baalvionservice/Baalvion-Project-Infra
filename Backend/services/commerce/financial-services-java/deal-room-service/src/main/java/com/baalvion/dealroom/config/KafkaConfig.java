package com.baalvion.dealroom.config;

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
 * Kafka wiring: JSON-string wire format, idempotent producer (drained by the outbox publisher),
 * and the topics this service owns ({@code dealroom.<entity>.<event>}). Producer-only.
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
    return new DefaultKafkaProducerFactory<>(props);
  }

  @Bean
  public KafkaTemplate<String, String> kafkaTemplate() {
    return new KafkaTemplate<>(producerFactory());
  }

  @Bean NewTopic openedTopic()    { return TopicBuilder.name("dealroom.deal.opened").partitions(6).replicas(1).build(); }
  @Bean NewTopic counteredTopic() { return TopicBuilder.name("dealroom.deal.countered").partitions(6).replicas(1).build(); }
  @Bean NewTopic agreedTopic()    { return TopicBuilder.name("dealroom.deal.agreed").partitions(6).replicas(1).build(); }
  @Bean NewTopic rejectedTopic()  { return TopicBuilder.name("dealroom.deal.rejected").partitions(6).replicas(1).build(); }
  @Bean NewTopic executedTopic()  { return TopicBuilder.name("dealroom.termsheet.executed").partitions(6).replicas(1).build(); }
}
