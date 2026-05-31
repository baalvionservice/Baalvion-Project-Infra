package com.baalvion.fx.repository;

import com.baalvion.fx.domain.FxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FxRateRepository extends JpaRepository<FxRate, UUID> {
  Optional<FxRate> findByBaseCurrencyAndQuoteCurrency(String baseCurrency, String quoteCurrency);
}
