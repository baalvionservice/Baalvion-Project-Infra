package com.baalvion.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadKycDocumentRequest {

  @NotBlank(message = "documentType required")
  @Size(max = 32)
  private String documentType;

  @NotBlank(message = "fileName required")
  @Size(max = 200)
  private String fileName;

  @NotBlank(message = "contentType required")
  @Size(max = 100)
  private String contentType;

  /** Base64-encoded document bytes. */
  @NotBlank(message = "contentBase64 required")
  private String contentBase64;

  /** Optional override of the default retention window. */
  private Integer retentionDays;
}
