package com.baalvion.smartcontract.repository;

import com.baalvion.smartcontract.domain.TradeContract;
import com.baalvion.smartcontract.domain.TradeContract.ContractStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TradeContractRepository extends JpaRepository<TradeContract, UUID> {

  Optional<TradeContract> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<TradeContract> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndContractNumber(UUID tenantId, String contractNumber);

  Page<TradeContract> findByTenantId(UUID tenantId, Pageable pageable);

  Page<TradeContract> findByTenantIdAndStatus(UUID tenantId, ContractStatus status, Pageable pageable);
}
