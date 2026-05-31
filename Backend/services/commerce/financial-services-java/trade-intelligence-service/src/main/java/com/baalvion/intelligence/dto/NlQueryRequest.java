package com.baalvion.intelligence.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** A natural-language trade question for the assistant to interpret. */
@Data
public class NlQueryRequest {

  @NotBlank
  private String query;
}
