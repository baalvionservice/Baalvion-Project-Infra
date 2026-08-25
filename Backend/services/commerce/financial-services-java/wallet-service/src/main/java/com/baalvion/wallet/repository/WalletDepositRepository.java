package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.WalletDeposit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletDepositRepository extends JpaRepository<WalletDeposit, UUID> {

  Optional<WalletDeposit> findByIdAndTenantId(UUID id, UUID tenantId);
}
