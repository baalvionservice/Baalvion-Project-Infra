package com.baalvion.audit.repository;

import com.baalvion.audit.domain.DltMessage;
import com.baalvion.audit.domain.DltMessage.DltStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DltMessageRepository extends JpaRepository<DltMessage, UUID> {

  @Query("SELECT d FROM DltMessage d ORDER BY d.createdAt DESC")
  Page<DltMessage> findAllOrdered(Pageable pageable);

  @Query("SELECT d FROM DltMessage d WHERE d.status = :status ORDER BY d.createdAt DESC")
  Page<DltMessage> findByStatus(@Param("status") DltStatus status, Pageable pageable);

  @Query("SELECT COUNT(d) FROM DltMessage d WHERE d.status = :status")
  long countByStatus(@Param("status") DltStatus status);
}
