package com.baalvion.risk.provider;

import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * A single watchlist entry as returned by a {@link SanctionsListProvider}, independent of storage.
 * The ingestion path normalizes names and upserts these into {@code sanctioned_entities}.
 */
@Data
@Builder
public class SanctionsListRecord {
  private ListSource listSource;
  private String externalId;
  private EntityType entityType;
  private String primaryName;
  @Builder.Default
  private List<String> aliases = List.of();
  @Builder.Default
  private List<String> programs = List.of();
  @Builder.Default
  private List<String> countries = List.of();
  @Builder.Default
  private List<String> addresses = List.of();
  private String dateOfBirth;
  private String remarks;
  private LocalDateTime sourcePublishedAt;
}
