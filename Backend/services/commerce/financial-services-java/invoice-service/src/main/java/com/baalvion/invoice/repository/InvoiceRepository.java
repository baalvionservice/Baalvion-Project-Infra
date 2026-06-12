package com.baalvion.invoice.repository;

import com.baalvion.invoice.domain.Invoice;
import com.baalvion.invoice.domain.Invoice.Direction;
import com.baalvion.invoice.domain.Invoice.Status;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.id = :id")
  Optional<Invoice> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  /**
   * Pessimistic lock used when mutating an invoice (status transition / payment application)
   * to prevent lost updates during concurrent writes (SELECT ... FOR UPDATE). Marked
   * {@code @Transactional} so the row lock always has an enclosing transaction even if a future
   * caller invokes it outside a service-level transaction.
   */
  @Transactional
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.id = :id")
  Optional<Invoice> findByIdAndTenantForUpdate(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  boolean existsByTenantIdAndInvoiceNumber(UUID tenantId, String invoiceNumber);

  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId ORDER BY i.createdAt DESC")
  Page<Invoice> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.direction = :direction ORDER BY i.createdAt DESC")
  Page<Invoice> findByTenantAndDirection(
    @Param("tenantId") UUID tenantId,
    @Param("direction") Direction direction,
    Pageable pageable
  );

  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.status = :status ORDER BY i.createdAt DESC")
  Page<Invoice> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") Status status,
    Pageable pageable
  );

  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.direction = :direction AND i.status = :status ORDER BY i.createdAt DESC")
  Page<Invoice> findByTenantAndDirectionAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("direction") Direction direction,
    @Param("status") Status status,
    Pageable pageable
  );

  // ---- Metrics ----

  @Query("SELECT i.status, COUNT(i) FROM Invoice i WHERE i.tenantId = :tenantId GROUP BY i.status")
  List<Object[]> countByStatus(@Param("tenantId") UUID tenantId);

  /**
   * Total outstanding (total - amountPaid) for the given direction, considering only invoices
   * whose status is NOT in {@code settledStatuses} (typically PAID + CANCELLED). Returns null
   * when no rows match (callers coalesce to zero) — avoiding a JPQL COALESCE keeps Hibernate
   * from returning the literal as an Integer and ClassCasting on the BigDecimal binding.
   */
  @Query("SELECT SUM(i.total - i.amountPaid) FROM Invoice i " +
         "WHERE i.tenantId = :tenantId AND i.direction = :direction " +
         "AND i.status NOT IN :settledStatuses")
  BigDecimal sumOutstandingByDirection(
    @Param("tenantId") UUID tenantId,
    @Param("direction") Direction direction,
    @Param("settledStatuses") Collection<Status> settledStatuses
  );

  @Query("SELECT COUNT(i) FROM Invoice i WHERE i.tenantId = :tenantId AND i.status = :status")
  long countByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") Status status
  );

  @Query("SELECT SUM(i.total - i.amountPaid) FROM Invoice i " +
         "WHERE i.tenantId = :tenantId AND i.status = :status")
  BigDecimal sumOutstandingByStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") Status status
  );

  // ---- Aging ----

  /**
   * Unpaid invoices for a direction used to build aging buckets. Excludes any invoice whose
   * status is in {@code excludedStatuses} (typically PAID, CANCELLED and DRAFT) so the AR/AP
   * aging reflects only money actually owed.
   */
  @Query("SELECT i FROM Invoice i WHERE i.tenantId = :tenantId AND i.direction = :direction " +
         "AND i.status NOT IN :excludedStatuses")
  List<Invoice> findUnpaidByDirection(
    @Param("tenantId") UUID tenantId,
    @Param("direction") Direction direction,
    @Param("excludedStatuses") Collection<Status> excludedStatuses
  );
}
