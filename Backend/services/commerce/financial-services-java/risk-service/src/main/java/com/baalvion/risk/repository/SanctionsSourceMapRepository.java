package com.baalvion.risk.repository;

import com.baalvion.risk.domain.SanctionsSourceMap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SanctionsSourceMapRepository extends JpaRepository<SanctionsSourceMap, UUID> {

  Optional<SanctionsSourceMap> findByListSourceAndExternalId(String listSource, String externalId);

  /** All source records that collapse into the same logical entity (cross-source evidence / sourceIds). */
  List<SanctionsSourceMap> findByMergeKey(String mergeKey);
}
