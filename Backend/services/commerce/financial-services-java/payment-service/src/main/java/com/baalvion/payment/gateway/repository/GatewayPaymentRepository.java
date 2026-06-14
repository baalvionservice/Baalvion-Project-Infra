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

  /** Idempotency lookup scoped to the tenant: the same key may recur across sites. */
  @Query("SELECT g FROM GatewayPayment g WHERE g.websiteSlug = :websiteSlug AND g.idempotencyKey = :key")
  Optional<GatewayPayment> findByWebsiteSlugAndIdempotencyKey(
    @Param("websiteSlug") String websiteSlug,
    @Param("key") String key
  );

  /** Webhook/capture/refund resolution scoped to the tenant + provider charge id. */
  @Query("SELECT g FROM GatewayPayment g WHERE g.websiteSlug = :websiteSlug AND g.provider = :provider AND g.providerRef = :providerRef")
  Optional<GatewayPayment> findByWebsiteSlugAndProviderAndProviderRef(
    @Param("websiteSlug") String websiteSlug,
    @Param("provider") String provider,
    @Param("providerRef") String providerRef
  );
}
