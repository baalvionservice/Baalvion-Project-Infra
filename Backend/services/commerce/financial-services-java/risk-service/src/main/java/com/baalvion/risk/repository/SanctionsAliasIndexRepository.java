package com.baalvion.risk.repository;

import com.baalvion.risk.domain.SanctionsAliasIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SanctionsAliasIndexRepository extends JpaRepository<SanctionsAliasIndex, UUID> {

  /** Fast exact-alias lookup (normalized). */
  List<SanctionsAliasIndex> findByAliasNormalized(String aliasNormalized);

  @Modifying
  @Query("delete from SanctionsAliasIndex a where a.entityId = :entityId")
  void deleteByEntityId(@Param("entityId") UUID entityId);
}
