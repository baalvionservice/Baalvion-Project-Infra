package com.baalvion.credit.repository;

import com.baalvion.credit.domain.InvoiceCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceCollectionRepository extends JpaRepository<InvoiceCollection, UUID> {
  List<InvoiceCollection> findByInvoiceIdOrderByCreatedAtAsc(UUID invoiceId);
}
