package com.baalvion.account.repository;

import com.baalvion.account.domain.Account;
import com.baalvion.account.domain.Account.AccountType;
import com.baalvion.account.domain.Account.KycStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

  @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.id = :id")
  Optional<Account> findByIdAndTenant(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  /**
   * Pessimistic lock used when mutating balances to prevent lost updates during
   * concurrent debit/credit (SELECT ... FOR UPDATE).
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.id = :id")
  Optional<Account> findByIdAndTenantForUpdate(
    @Param("id") UUID id,
    @Param("tenantId") UUID tenantId
  );

  Optional<Account> findByAccountNumber(String accountNumber);

  boolean existsByAccountNumber(String accountNumber);

  @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId ORDER BY a.createdAt DESC")
  Page<Account> findByTenant(
    @Param("tenantId") UUID tenantId,
    Pageable pageable
  );

  @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.accountType = :type")
  Page<Account> findByTenantAndType(
    @Param("tenantId") UUID tenantId,
    @Param("type") AccountType type,
    Pageable pageable
  );

  @Query("SELECT a FROM Account a WHERE a.tenantId = :tenantId AND a.kycStatus = :status")
  Page<Account> findByTenantAndKycStatus(
    @Param("tenantId") UUID tenantId,
    @Param("status") KycStatus status,
    Pageable pageable
  );
}
