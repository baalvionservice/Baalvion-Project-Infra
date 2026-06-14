package com.baalvion.invoice.repository;

import com.baalvion.invoice.domain.InvoiceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceEventRepository extends JpaRepository<InvoiceEvent, UUID> {

  @Query("SELECT e FROM InvoiceEvent e WHERE e.tenantId = :tenantId AND e.invoiceId = :invoiceId ORDER BY e.createdAt ASC")
  List<InvoiceEvent> findByInvoice(
    @Param("invoiceId") UUID invoiceId,
    @Param("tenantId") UUID tenantId
  );
}
