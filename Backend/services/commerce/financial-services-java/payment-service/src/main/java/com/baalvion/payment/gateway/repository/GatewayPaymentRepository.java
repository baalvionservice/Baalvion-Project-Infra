package com.baalvion.payment.gateway.repository;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GatewayPaymentRepository extends JpaRepository<GatewayPayment, UUID> {

  @Query("SELECT g FROM GatewayPayment g WHERE g.idempotencyKey = :key")
  Optional<GatewayPayment> findByIdempotencyKey(@Param("key") String key);

  @Query("SELECT g FROM GatewayPayment g WHERE g.provider = :provider AND g.providerRef = :providerRef")
  Optional<GatewayPayment> findByProviderAndProviderRef(
    @Param("provider") String provider,
    @Param("providerRef") String providerRef
  );
}
