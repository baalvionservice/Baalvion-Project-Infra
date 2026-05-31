package com.baalvion.intelligence.repository;

import com.baalvion.intelligence.domain.DemandForecast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, UUID> {

  Optional<DemandForecast> findByIdAndTenantId(UUID id, UUID tenantId);
}
