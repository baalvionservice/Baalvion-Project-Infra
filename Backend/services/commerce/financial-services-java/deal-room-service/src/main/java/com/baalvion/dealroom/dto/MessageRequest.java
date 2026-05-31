package com.baalvion.dealroom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** A chat message posted into the deal-room thread. */
@Data
public class MessageRequest {

  /** BUYER or SELLER. */
  @NotBlank
  private String senderRole;

  @NotBlank
  private String body;
}
