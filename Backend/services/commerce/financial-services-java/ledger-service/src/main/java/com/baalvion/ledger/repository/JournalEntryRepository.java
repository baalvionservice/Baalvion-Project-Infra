package com.baalvion.ledger.repository;

import com.baalvion.ledger.domain.JournalEntry;
import com.baalvion.ledger.domain.JournalEntry.EntryStatus;
import com.baalvion.ledger.domain.JournalEntry.EntryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.transactionRef = :transactionRef")
  Optional<JournalEntry> findByTenantAndTransactionRef(
    @Param("tenantId") UUID tenantId,
    @Param("transactionRef") String transactionRef
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.id = :id")
  Optional<JournalEntry> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId ORDER BY j.postedAt DESC")
  Page<JournalEntry> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.debitAccountId = :accountId")
  Page<JournalEntry> findByTenantAndDebitAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId,
    Pageable pageable
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.creditAccountId = :accountId")
  Page<JournalEntry> findByTenantAndCreditAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId,
    Pageable pageable
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.entryType = :entryType")
  Page<JournalEntry> findByTenantAndEntryType(
    @Param("tenantId") UUID tenantId,
    @Param("entryType") EntryType entryType,
    Pageable pageable
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.status = :status")
  Page<JournalEntry> findByTenantAndStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") EntryStatus status,
    Pageable pageable
  );

  @Query("SELECT COALESCE(SUM(j.amount), 0) FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.debitAccountId = :accountId AND j.status = 'POSTED'")
  BigDecimal sumDebitsByAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId
  );

  @Query("SELECT COALESCE(SUM(j.amount), 0) FROM JournalEntry j WHERE j.tenantId = :tenantId AND j.creditAccountId = :accountId AND j.status = 'POSTED'")
  BigDecimal sumCreditsByAccount(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId
  );

  @Query("SELECT j FROM JournalEntry j WHERE j.tenantId = :tenantId AND (j.debitAccountId = :accountId OR j.creditAccountId = :accountId) AND j.status = 'POSTED' ORDER BY j.postedAt DESC")
  List<JournalEntry> findAccountStatement(
    @Param("tenantId") UUID tenantId,
    @Param("accountId") UUID accountId
  );
}
