package com.baalvion.tradefinance.repository;

import com.baalvion.tradefinance.domain.LcAmendment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LcAmendmentRepository extends JpaRepository<LcAmendment, UUID> {

  List<LcAmendment> findByLcIdOrderByAmendmentNumberAsc(UUID lcId);

  Optional<LcAmendment> findByIdAndTenantId(UUID id, UUID tenantId);

  long countByLcId(UUID lcId);
}
