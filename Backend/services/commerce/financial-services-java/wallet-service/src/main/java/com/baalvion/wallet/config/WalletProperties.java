package com.baalvion.wallet.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed configuration for wallet policy ({@code app.wallet}). */
@Data
@Component
@ConfigurationProperties(prefix = "app.wallet")
public class WalletProperties {

  /** Whether a debit may overdraw the available balance (always false in production). */
  private boolean allowOverdraft = false;

  /** Default hold validity in minutes before the scheduled sweep auto-releases it. */
  private long holdTtlMinutes = 1440;
}
