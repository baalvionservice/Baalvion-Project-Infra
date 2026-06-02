package com.baalvion.dealroom.repository;

import com.baalvion.dealroom.domain.DealMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealMessageRepository extends JpaRepository<DealMessage, UUID> {

  List<DealMessage> findByDealIdOrderByCreatedAtAsc(UUID dealId);
}
