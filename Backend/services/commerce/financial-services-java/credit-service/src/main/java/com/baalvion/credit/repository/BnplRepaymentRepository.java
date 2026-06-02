package com.baalvion.credit.repository;

import com.baalvion.credit.domain.BnplRepayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BnplRepaymentRepository extends JpaRepository<BnplRepayment, UUID> {
  List<BnplRepayment> findByPlanIdOrderByCreatedAtAsc(UUID planId);
}
