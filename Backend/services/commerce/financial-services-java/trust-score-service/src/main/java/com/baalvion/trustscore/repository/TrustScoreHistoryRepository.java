package com.baalvion.trustscore.repository;

import com.baalvion.trustscore.domain.TrustScoreHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TrustScoreHistoryRepository extends JpaRepository<TrustScoreHistory, UUID> {

  Page<TrustScoreHistory> findByTenantIdAndSubjectIdAndSubjectTypeOrderByCreatedAtDesc(
    UUID tenantId, UUID subjectId, String subjectType, Pageable pageable);
}
