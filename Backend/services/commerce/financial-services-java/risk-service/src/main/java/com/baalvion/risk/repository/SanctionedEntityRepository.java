package com.baalvion.risk.repository;

import com.baalvion.risk.domain.SanctionedEntity;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SanctionedEntityRepository extends JpaRepository<SanctionedEntity, UUID> {

  Optional<SanctionedEntity> findByListSourceAndExternalId(ListSource listSource, String externalId);

  List<SanctionedEntity> findByActiveTrue();

  List<SanctionedEntity> findByActiveTrueAndEntityType(EntityType entityType);

  long countByActiveTrue();

  long countByListSource(ListSource listSource);
}
