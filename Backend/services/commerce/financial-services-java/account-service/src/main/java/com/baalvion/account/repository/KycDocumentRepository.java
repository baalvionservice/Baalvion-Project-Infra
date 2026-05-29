package com.baalvion.account.repository;

import com.baalvion.account.domain.KycDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {

  @Query("SELECT d FROM KycDocument d WHERE d.tenantId = :tenantId AND d.id = :id")
  Optional<KycDocument> findByIdAndTenant(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

  @Query("SELECT d FROM KycDocument d WHERE d.tenantId = :tenantId AND d.accountId = :accountId ORDER BY d.createdAt DESC")
  Page<KycDocument> findByTenantAndAccount(@Param("tenantId") UUID tenantId, @Param("accountId") UUID accountId, Pageable pageable);

  /** Retention purge: delete documents past their expiry (owner connection bypasses RLS). */
  @Modifying
  @Query("DELETE FROM KycDocument d WHERE d.expiresAt IS NOT NULL AND d.expiresAt < :now")
  int deleteExpired(@Param("now") LocalDateTime now);
}
