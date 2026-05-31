package com.baalvion.dispute.repository;

import com.baalvion.dispute.domain.DisputeAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DisputeActionRepository extends JpaRepository<DisputeAction, UUID> {

  List<DisputeAction> findByDisputeIdOrderByCreatedAtAsc(UUID disputeId);
}
