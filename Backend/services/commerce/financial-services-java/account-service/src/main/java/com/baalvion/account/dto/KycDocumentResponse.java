package com.baalvion.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** KYC document metadata (no content). */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycDocumentResponse {
  private UUID id;
  private UUID accountId;
  private String documentType;
  private String fileName;
  private String contentType;
  private String sha256;
  private long sizeBytes;
  private String status;
  private String uploadedBy;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  /** Populated only by the content endpoint (decrypted, base64). */
  private String contentBase64;
}
