package com.baalvion.dealroom.repository;

import com.baalvion.dealroom.domain.DealRoom;
import com.baalvion.dealroom.domain.DealRoom.DealStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DealRoomRepository extends JpaRepository<DealRoom, UUID> {

  Optional<DealRoom> findByIdAndTenantId(UUID id, UUID tenantId);

  Optional<DealRoom> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

  boolean existsByTenantIdAndReference(UUID tenantId, String reference);

  Page<DealRoom> findByTenantId(UUID tenantId, Pageable pageable);

  Page<DealRoom> findByTenantIdAndStatus(UUID tenantId, DealStatus status, Pageable pageable);

  Page<DealRoom> findByTenantIdAndBuyerId(UUID tenantId, UUID buyerId, Pageable pageable);

  Page<DealRoom> findByTenantIdAndSellerId(UUID tenantId, UUID sellerId, Pageable pageable);

  List<DealRoom> findByStatusInAndExpiresAtBefore(List<DealStatus> statuses, LocalDateTime cutoff);
}
