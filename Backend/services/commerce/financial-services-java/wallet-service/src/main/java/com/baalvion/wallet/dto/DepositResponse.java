package com.baalvion.wallet.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Same field set as the frontend's existing GiftCardCheckout type (giftcard-service's crypto
 * checkout response) so the same QR/address/poll UI can render either without a new shape.
 */
@Data
@Builder
public class DepositResponse {
  private UUID depositId;
  private String asset;
  private String network;
  private String address;
  private String amountValue;
  private String amountDisplay;
  private String expiresAt;
}
