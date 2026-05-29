package com.baalvion.payment.repository;

import com.baalvion.payment.domain.Transaction;
import com.baalvion.payment.domain.Transaction.PaymentScheme;
import com.baalvion.payment.domain.Transaction.TransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.idempotencyKey = :key")
  Optional<Transaction> findByTenantAndIdempotencyKey(
    @Param("tenantId") UUID tenantId,
    @Param("key") String key
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.id = :id")
  Optional<Transaction> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId ORDER BY t.createdAt DESC")
  Page<Transaction> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.sourceAccountId = :accountId")
  Page<Transaction> findByTenantAndSourceAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId,
    Pageable pageable
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.destinationAccountId = :accountId")
  Page<Transaction> findByTenantAndDestinationAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId,
    Pageable pageable
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.status = :status")
  Page<Transaction> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") TransactionStatus status,
    Pageable pageable
  );

  @Query("SELECT t FROM Transaction t WHERE t.tenantId = :tenantId AND t.paymentScheme = :scheme")
  Page<Transaction> findByTenantAndScheme(
    @Param("tenantId") UUID tenantId,
    @Param("scheme") PaymentScheme scheme,
    Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.tenantId = :tenantId AND t.sourceAccountId = :accountId AND t.status = 'COMPLETED' AND t.createdAt >= :startOfDay")
  BigDecimal sumDailyOutflows(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId,
    @Param("startOfDay") LocalDateTime startOfDay
  );
}
