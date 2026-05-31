package com.baalvion.wallet.repository;

import com.baalvion.wallet.domain.WalletBalance;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletBalanceRepository extends JpaRepository<WalletBalance, UUID> {

  List<WalletBalance> findByWalletId(UUID walletId);

  Optional<WalletBalance> findByWalletIdAndCurrency(UUID walletId, String currency);

  /**
   * Row-locks the balance for the duration of the transaction so concurrent debits/credits on the
   * same (wallet, currency) serialise — the authoritative path for all balance mutations.
   */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT b FROM WalletBalance b WHERE b.walletId = :walletId AND b.currency = :currency")
  Optional<WalletBalance> lockByWalletAndCurrency(@Param("walletId") UUID walletId, @Param("currency") String currency);
}
