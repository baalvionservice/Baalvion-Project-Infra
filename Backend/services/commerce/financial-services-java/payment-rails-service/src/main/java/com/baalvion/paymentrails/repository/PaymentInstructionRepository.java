package com.baalvion.paymentrails.repository;

import com.baalvion.paymentrails.domain.PaymentInstruction;
import com.baalvion.paymentrails.domain.PaymentInstruction.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentInstructionRepository extends JpaRepository<PaymentInstruction, UUID> {

  Optional<PaymentInstruction> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<PaymentInstruction> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  Optional<PaymentInstruction> findByTenantIdAndRailRef(UUID tenantId, String railRef);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<PaymentInstruction> findByTenantId(UUID tenantId, Pageable pageable);

  Page<PaymentInstruction> findByTenantIdAndStatus(UUID tenantId, PaymentStatus status, Pageable pageable);
}
