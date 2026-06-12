package com.baalvion.invoice.repository;

import com.baalvion.invoice.domain.InvoiceLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, UUID> {

  @Query("SELECT li FROM InvoiceLineItem li WHERE li.tenantId = :tenantId AND li.invoiceId = :invoiceId")
  List<InvoiceLineItem> findByInvoice(
    @Param("invoiceId") UUID invoiceId,
    @Param("tenantId") UUID tenantId
  );
}
