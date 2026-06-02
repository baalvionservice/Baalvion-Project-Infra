package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.WalletHold;
import com.baalvion.wallet.domain.WalletHold.HoldStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletHoldRepository extends JpaRepository<WalletHold, UUID> {

  Optional<WalletHold> findByIdAndTenantId(UUID id, UUID tenantId);

  List<WalletHold> findByWalletId(UUID walletId);

  List<WalletHold> findByStatusAndExpiresAtBefore(HoldStatus status, LocalDateTime cutoff);
}
