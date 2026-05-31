package com.baalvion.smartcontract.repository;

import com.baalvion.smartcontract.domain.ContractSignature;
import com.baalvion.smartcontract.domain.ContractSignature.Party;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractSignatureRepository extends JpaRepository<ContractSignature, UUID> {

  List<ContractSignature> findByContractId(UUID contractId);

  Optional<ContractSignature> findByContractIdAndParty(UUID contractId, Party party);
}
