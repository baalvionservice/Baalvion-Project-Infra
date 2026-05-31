package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.WalletEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletEntryRepository extends JpaRepository<WalletEntry, UUID> {

  Optional<WalletEntry> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  Page<WalletEntry> findByWalletId(UUID walletId, Pageable pageable);

  Page<WalletEntry> findByWalletIdAndCurrency(UUID walletId, String currency, Pageable pageable);
}
