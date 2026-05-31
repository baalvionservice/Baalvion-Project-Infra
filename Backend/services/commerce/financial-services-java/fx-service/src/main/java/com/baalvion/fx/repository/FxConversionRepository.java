package com.baalvion.fx.repository;

import com.baalvion.fx.domain.FxConversion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FxConversionRepository extends JpaRepository<FxConversion, UUID> {

  Optional<FxConversion> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<FxConversion> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  Page<FxConversion> findByTenantId(UUID tenantId, Pageable pageable);
}
