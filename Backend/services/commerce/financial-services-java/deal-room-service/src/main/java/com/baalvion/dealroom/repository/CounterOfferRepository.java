package com.baalvion.dealroom.repository;

import com.baalvion.dealroom.domain.CounterOffer;
import com.baalvion.dealroom.domain.CounterOffer.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CounterOfferRepository extends JpaRepository<CounterOffer, UUID> {

  Optional<CounterOffer> findByIdAndTenantId(UUID id, UUID tenantId);

  List<CounterOffer> findByDealIdOrderByRoundAsc(UUID dealId);

  List<CounterOffer> findByDealIdAndStatus(UUID dealId, OfferStatus status);

  long countByDealId(UUID dealId);
}
