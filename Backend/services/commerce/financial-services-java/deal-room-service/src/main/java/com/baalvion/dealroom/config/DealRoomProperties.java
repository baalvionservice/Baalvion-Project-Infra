package com.baalvion.dealroom.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed configuration for deal-room negotiation rules ({@code app.deal-room}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.deal-room")
public class DealRoomProperties {

  /** Lifetime of an open deal room before it auto-expires (hours). */
  private int defaultTtlHours = 168;

  /** Default validity window of a counter-offer when the proposer sets none (hours). */
  private int offerValidityHours = 48;

  /** Maximum negotiation rounds before the room must be re-opened. */
  private int maxRounds = 50;
}
