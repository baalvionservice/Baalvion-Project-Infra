package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

  Optional<Wallet> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<Wallet> findByTenantIdAndHolderId(UUID tenantId, UUID holderId);

  boolean existsByTenantIdAndHolderId(UUID tenantId, UUID holderId);

  Page<Wallet> findByTenantId(UUID tenantId, Pageable pageable);
}
