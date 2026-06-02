package com.baalvion.trustscore.repository;

import com.baalvion.trustscore.domain.TrustScore;
import com.baalvion.trustscore.domain.TrustScore.Band;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrustScoreRepository extends JpaRepository<TrustScore, UUID> {

  Optional<TrustScore> findByTenantIdAndSubjectIdAndSubjectType(UUID tenantId, UUID subjectId, String subjectType);

  Page<TrustScore> findByTenantId(UUID tenantId, Pageable pageable);

  Page<TrustScore> findByTenantIdAndBand(UUID tenantId, Band band, Pageable pageable);
}
