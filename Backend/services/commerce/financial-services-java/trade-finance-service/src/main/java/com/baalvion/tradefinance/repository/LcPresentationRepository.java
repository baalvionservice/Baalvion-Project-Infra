package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.LcPresentation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LcPresentationRepository extends JpaRepository<LcPresentation, UUID> {

  List<LcPresentation> findByLcIdOrderByPresentationNumberAsc(UUID lcId);

  Optional<LcPresentation> findByIdAndTenantId(UUID id, UUID tenantId);

  long countByLcId(UUID lcId);
}
