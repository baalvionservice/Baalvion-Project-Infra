package com.baalvion.invoice.service;

import com.baalvion.invoice.domain.Invoice;
import com.baalvion.invoice.domain.Invoice.Direction;
import com.baalvion.invoice.domain.Invoice.Status;
import com.baalvion.invoice.domain.InvoiceEvent;
import com.baalvion.invoice.domain.InvoiceLineItem;
import com.baalvion.invoice.dto.AgingSummaryResponse;
import com.baalvion.invoice.dto.CreateInvoiceRequest;
import com.baalvion.invoice.dto.InvoiceLineItemDto;
import com.baalvion.invoice.dto.InvoiceMetricsResponse;
import com.baalvion.invoice.dto.InvoiceResponse;
import com.baalvion.invoice.dto.RecordPaymentRequest;
import com.baalvion.invoice.exception.NotFoundException;
import com.baalvion.invoice.repository.InvoiceEventRepository;
import com.baalvion.invoice.repository.InvoiceLineItemRepository;
import com.baalvion.invoice.repository.InvoiceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * InvoiceService: invoice lifecycle, AR/AP and metrics.
 *
 * Runs every operation under the RLS tenant context (the common-security RlsTenantAspect sets
 * the {@code app.current_tenant_id} GUC per transaction; this service is {@code @Transactional}
 * exactly like the account-service template). Money is BigDecimal, scaled to 4 decimals. Every
 * lifecycle transition and every recorded payment appends a row to {@code invoice_events}.
 */
@Slf4j
@Service
@Transactional
public class InvoiceService {

  private static final int MONEY_SCALE = 4;

  private final InvoiceRepository repository;
  private final InvoiceLineItemRepository lineItemRepository;
  private final InvoiceEventRepository eventRepository;
  private final OutboxService outboxService;
  private final ObjectMapper objectMapper;
  private final SecureRandom random = new SecureRandom();

  /**
   * Allowed invoice status transitions (state machine). Any transition not listed here is
   * rejected with IllegalStateException. Note: ISSUED -> PARTIALLY_PAID / PAID are driven by
   * {@link #recordPayment} rather than a direct transition call.
   */
  private static final Map<Status, Set<Status>> STATUS_TRANSITIONS = new EnumMap<>(Status.class);

  static {
    STATUS_TRANSITIONS.put(Status.DRAFT, EnumSet.of(Status.ISSUED, Status.CANCELLED));
    STATUS_TRANSITIONS.put(Status.ISSUED, EnumSet.of(
      Status.PARTIALLY_PAID, Status.PAID, Status.OVERDUE, Status.DISPUTED, Status.CANCELLED));
    STATUS_TRANSITIONS.put(Status.PARTIALLY_PAID, EnumSet.of(
      Status.PAID, Status.OVERDUE, Status.DISPUTED));
    STATUS_TRANSITIONS.put(Status.OVERDUE, EnumSet.of(
      Status.PARTIALLY_PAID, Status.PAID, Status.DISPUTED));
    STATUS_TRANSITIONS.put(Status.DISPUTED, EnumSet.of(Status.ISSUED, Status.CANCELLED));
    STATUS_TRANSITIONS.put(Status.PAID, EnumSet.noneOf(Status.class));
    STATUS_TRANSITIONS.put(Status.CANCELLED, EnumSet.noneOf(Status.class));
  }

  public InvoiceService(InvoiceRepository repository,
                        InvoiceLineItemRepository lineItemRepository,
                        InvoiceEventRepository eventRepository,
                        OutboxService outboxService,
                        ObjectMapper objectMapper) {
    this.repository = repository;
    this.lineItemRepository = lineItemRepository;
    this.eventRepository = eventRepository;
    this.outboxService = outboxService;
    this.objectMapper = objectMapper;
  }

  /**
   * Enqueue a domain event onto the transactional outbox. Runs inside the caller's @Transactional
   * method, so the event row commits atomically with the invoice mutation and is then delivered to
   * Kafka by {@link OutboxRelay} with retry + dead-letter — no more fire-and-forget event loss.
   */
  private void publish(UUID tenantId, String topic, String key, Object payload) {
    outboxService.enqueue(tenantId, topic, key, payload);
  }

  // ---- Create ----

  public InvoiceResponse createInvoice(UUID tenantId, CreateInvoiceRequest request) {
    Direction direction = parseDirection(request.getDirection());

    List<InvoiceLineItemDto> requestedLines = request.getLineItems();
    if (requestedLines == null || requestedLines.isEmpty()) {
      throw new IllegalArgumentException("At least one line item is required");
    }

    UUID invoiceId = UUID.randomUUID();
    List<InvoiceLineItem> lineItems = new ArrayList<>(requestedLines.size());
    BigDecimal subtotal = BigDecimal.ZERO;

    for (InvoiceLineItemDto dto : requestedLines) {
      if (dto.getQuantity() == null || dto.getQuantity().signum() <= 0) {
        throw new IllegalArgumentException("Line item quantity must be positive");
      }
      if (dto.getUnitPrice() == null || dto.getUnitPrice().signum() < 0) {
        throw new IllegalArgumentException("Line item unit price must be non-negative");
      }
      BigDecimal lineTotal = scale(dto.getQuantity().multiply(dto.getUnitPrice()));
      subtotal = subtotal.add(lineTotal);

      lineItems.add(InvoiceLineItem.builder()
        .tenantId(tenantId)
        .invoiceId(invoiceId)
        .description(dto.getDescription())
        .quantity(scale(dto.getQuantity()))
        .unitPrice(scale(dto.getUnitPrice()))
        .lineTotal(lineTotal)
        .build());
    }

    subtotal = scale(subtotal);
    BigDecimal taxAmount = scale(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO);
    BigDecimal total = scale(subtotal.add(taxAmount));

    Invoice invoice = Invoice.builder()
      .id(invoiceId)
      .tenantId(tenantId)
      .invoiceNumber(generateInvoiceNumber(tenantId))
      .direction(direction)
      .counterpartyName(request.getCounterpartyName())
      .counterpartyId(request.getCounterpartyId())
      .currency(request.getCurrency())
      .subtotal(subtotal)
      .taxAmount(taxAmount)
      .total(total)
      .amountPaid(BigDecimal.ZERO)
      .status(Status.DRAFT)
      .dueDate(request.getDueDate())
      .orderId(request.getOrderId())
      .notes(request.getNotes())
      .metadata(request.getMetadata() != null ? request.getMetadata() : "{}")
      .build();

    Invoice saved = repository.save(invoice);
    lineItemRepository.saveAll(lineItems);
    recordEvent(saved, "INVOICE_CREATED", null, Status.DRAFT, null, null);

    log.info("Invoice created: id={}, tenant={}, number={}, direction={}, total={}",
      saved.getId(), tenantId, saved.getInvoiceNumber(), direction, total);

    InvoiceResponse response = mapToResponse(saved, lineItems);
    publish(tenantId, "invoice.created", saved.getId().toString(), response);
    return response;
  }

  // ---- Reads ----

  @Transactional(readOnly = true)
  public InvoiceResponse getInvoice(UUID tenantId, UUID invoiceId) {
    Invoice invoice = loadInvoice(tenantId, invoiceId);
    return mapToResponse(invoice, lineItemRepository.findByInvoice(invoiceId, tenantId));
  }

  @Transactional(readOnly = true)
  public Page<InvoiceResponse> listInvoices(UUID tenantId, String direction, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Invoice> invoices = queryInvoices(tenantId, direction, status, pageable);
    return invoices.map(this::mapToResponseWithoutLines);
  }

  @Transactional(readOnly = true)
  public Page<InvoiceResponse> listByDirection(UUID tenantId, Direction direction, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Invoice> invoices;
    if (status != null) {
      invoices = repository.findByTenantAndDirectionAndStatus(tenantId, direction, parseStatus(status), pageable);
    } else {
      invoices = repository.findByTenantAndDirection(tenantId, direction, pageable);
    }
    return invoices.map(this::mapToResponseWithoutLines);
  }

  private Page<Invoice> queryInvoices(UUID tenantId, String direction, String status, Pageable pageable) {
    boolean hasDirection = direction != null;
    boolean hasStatus = status != null;
    if (hasDirection && hasStatus) {
      return repository.findByTenantAndDirectionAndStatus(
        tenantId, parseDirection(direction), parseStatus(status), pageable);
    }
    if (hasDirection) {
      return repository.findByTenantAndDirection(tenantId, parseDirection(direction), pageable);
    }
    if (hasStatus) {
      return repository.findByTenantAndStatus(tenantId, parseStatus(status), pageable);
    }
    return repository.findByTenant(tenantId, pageable);
  }

  // ---- Lifecycle transitions ----

  public InvoiceResponse issue(UUID tenantId, UUID invoiceId, String actor) {
    Invoice invoice = lockInvoice(tenantId, invoiceId);
    Status from = invoice.getStatus();
    transition(invoice, Status.ISSUED, actor, "ISSUED");
    if (invoice.getIssueDate() == null) {
      invoice.setIssueDate(LocalDate.now());
    }
    Invoice saved = repository.save(invoice);
    recordEvent(saved, "INVOICE_ISSUED", from, Status.ISSUED, actor, null);
    publish(tenantId, "invoice.issued", saved.getId().toString(), mapToResponseWithoutLines(saved));
    return mapToResponse(saved, lineItemRepository.findByInvoice(invoiceId, tenantId));
  }

  public InvoiceResponse cancel(UUID tenantId, UUID invoiceId, String actor) {
    Invoice invoice = lockInvoice(tenantId, invoiceId);
    Status from = invoice.getStatus();
    transition(invoice, Status.CANCELLED, actor, "CANCELLED");
    Invoice saved = repository.save(invoice);
    recordEvent(saved, "INVOICE_CANCELLED", from, Status.CANCELLED, actor, null);
    publish(tenantId, "invoice.cancelled", saved.getId().toString(), mapToResponseWithoutLines(saved));
    return mapToResponse(saved, lineItemRepository.findByInvoice(invoiceId, tenantId));
  }

  public InvoiceResponse dispute(UUID tenantId, UUID invoiceId, String actor) {
    Invoice invoice = lockInvoice(tenantId, invoiceId);
    Status from = invoice.getStatus();
    transition(invoice, Status.DISPUTED, actor, "DISPUTED");
    Invoice saved = repository.save(invoice);
    recordEvent(saved, "INVOICE_DISPUTED", from, Status.DISPUTED, actor, null);
    publish(tenantId, "invoice.disputed", saved.getId().toString(), mapToResponseWithoutLines(saved));
    return mapToResponse(saved, lineItemRepository.findByInvoice(invoiceId, tenantId));
  }

  /**
   * Apply a payment. amount_paid += amount; if amount_paid >= total -> PAID else PARTIALLY_PAID.
   * Only valid for invoices that are owed (ISSUED, PARTIALLY_PAID or OVERDUE).
   */
  public InvoiceResponse recordPayment(UUID tenantId, UUID invoiceId, RecordPaymentRequest request) {
    Invoice invoice = lockInvoice(tenantId, invoiceId);

    if (request.getAmount() == null || request.getAmount().signum() <= 0) {
      throw new IllegalArgumentException("Payment amount must be positive");
    }
    if (!request.getCurrency().equals(invoice.getCurrency())) {
      throw new IllegalArgumentException("Payment currency " + request.getCurrency()
        + " does not match invoice currency " + invoice.getCurrency());
    }

    Status current = invoice.getStatus();
    Set<Status> payable = EnumSet.of(Status.ISSUED, Status.PARTIALLY_PAID, Status.OVERDUE);
    if (!payable.contains(current)) {
      throw new IllegalStateException("Cannot record a payment on an invoice in status " + current);
    }

    BigDecimal newPaid = scale(invoice.getAmountPaid().add(request.getAmount()));
    if (newPaid.compareTo(invoice.getTotal()) > 0) {
      throw new IllegalStateException("Payment exceeds the amount due: paid=" + newPaid
        + ", total=" + invoice.getTotal());
    }

    invoice.setAmountPaid(newPaid);
    Status target = newPaid.compareTo(invoice.getTotal()) >= 0 ? Status.PAID : Status.PARTIALLY_PAID;
    // A payment may resolve an OVERDUE/PARTIALLY_PAID invoice; the resulting status is derived
    // from the balance, not the transition table, so set it directly after validating eligibility.
    invoice.setStatus(target);

    Invoice saved = repository.save(invoice);

    Map<String, Object> detail = new HashMap<>();
    detail.put("amount", request.getAmount());
    detail.put("currency", request.getCurrency());
    detail.put("reference", request.getReference());
    detail.put("amountPaid", newPaid);
    detail.put("total", invoice.getTotal());
    recordEvent(saved, "PAYMENT_RECORDED", current, target, request.getReference(), detail);

    log.info("Payment recorded: invoice={}, tenant={}, amount={}, ref={}, {} -> {}, paid={}/{}",
      invoiceId, tenantId, request.getAmount(), sanitizeForLog(request.getReference()),
      current, target, newPaid, invoice.getTotal());

    Map<String, Object> event = new HashMap<>();
    event.put("invoiceId", invoiceId);
    event.put("tenantId", tenantId);
    event.put("amount", request.getAmount());
    event.put("amountPaid", newPaid);
    event.put("status", target.name());
    publish(tenantId, "invoice.payment.recorded", invoiceId.toString(), event);

    return mapToResponse(saved, lineItemRepository.findByInvoice(invoiceId, tenantId));
  }

  // ---- Metrics & aging ----

  @Transactional(readOnly = true)
  public InvoiceMetricsResponse metrics(UUID tenantId) {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (Status s : Status.values()) {
      counts.put(s.name(), 0L);
    }
    for (Object[] row : repository.countByStatus(tenantId)) {
      Status s = (Status) row[0];
      Long c = (Long) row[1];
      counts.put(s.name(), c);
    }

    Set<Status> settled = EnumSet.of(Status.PAID, Status.CANCELLED);
    return InvoiceMetricsResponse.builder()
      .countsByStatus(counts)
      .totalOutstandingReceivable(scale(nullToZero(
        repository.sumOutstandingByDirection(tenantId, Direction.RECEIVABLE, settled))))
      .totalOutstandingPayable(scale(nullToZero(
        repository.sumOutstandingByDirection(tenantId, Direction.PAYABLE, settled))))
      .overdueCount(repository.countByTenantAndStatus(tenantId, Status.OVERDUE))
      .overdueAmount(scale(nullToZero(repository.sumOutstandingByStatus(tenantId, Status.OVERDUE))))
      .build();
  }

  @Transactional(readOnly = true)
  public AgingSummaryResponse aging(UUID tenantId, Direction direction) {
    Set<Status> excluded = EnumSet.of(Status.PAID, Status.CANCELLED, Status.DRAFT);
    List<Invoice> unpaid = repository.findUnpaidByDirection(tenantId, direction, excluded);
    LocalDate today = LocalDate.now();

    BigDecimal current = BigDecimal.ZERO;
    BigDecimal d1to30 = BigDecimal.ZERO;
    BigDecimal d31to60 = BigDecimal.ZERO;
    BigDecimal d61to90 = BigDecimal.ZERO;
    BigDecimal d90plus = BigDecimal.ZERO;

    String currency = null;
    boolean singleCurrency = true;

    for (Invoice inv : unpaid) {
      BigDecimal outstanding = scale(inv.getTotal().subtract(inv.getAmountPaid()));
      if (outstanding.signum() <= 0) {
        continue;
      }

      if (currency == null) {
        currency = inv.getCurrency();
      } else if (!currency.equals(inv.getCurrency())) {
        singleCurrency = false;
      }

      long daysPastDue = inv.getDueDate() == null ? -1 : ChronoUnit.DAYS.between(inv.getDueDate(), today);
      if (daysPastDue <= 0) {
        current = current.add(outstanding);
      } else if (daysPastDue <= 30) {
        d1to30 = d1to30.add(outstanding);
      } else if (daysPastDue <= 60) {
        d31to60 = d31to60.add(outstanding);
      } else if (daysPastDue <= 90) {
        d61to90 = d61to90.add(outstanding);
      } else {
        d90plus = d90plus.add(outstanding);
      }
    }

    BigDecimal totalOutstanding = scale(current.add(d1to30).add(d31to60).add(d61to90).add(d90plus));

    return AgingSummaryResponse.builder()
      .direction(direction.name())
      .currency(singleCurrency ? currency : null)
      .current(scale(current))
      .days1To30(scale(d1to30))
      .days31To60(scale(d31to60))
      .days61To90(scale(d61to90))
      .days90Plus(scale(d90plus))
      .totalOutstanding(totalOutstanding)
      .invoiceCount(unpaid.size())
      .build();
  }

  // ---- Helpers ----

  private void transition(Invoice invoice, Status target, String actor, String label) {
    Status current = invoice.getStatus();
    if (current == target) {
      return;
    }
    if (!STATUS_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
      throw new IllegalStateException("Invalid invoice transition: " + current + " -> " + target);
    }
    invoice.setStatus(target);
    log.debug("Invoice {} transition {} -> {} ({}) by {}",
      invoice.getId(), current, target, label, sanitizeForLog(actor));
  }

  private void recordEvent(Invoice invoice, String eventType, Status from, Status to,
                           String actor, Map<String, Object> detail) {
    String detailJson = "{}";
    if (detail != null) {
      try {
        detailJson = objectMapper.writeValueAsString(detail);
      } catch (Exception e) {
        log.error("Failed to serialize event detail for invoice {}: {}", invoice.getId(), e.getMessage());
      }
    }
    InvoiceEvent event = InvoiceEvent.builder()
      .tenantId(invoice.getTenantId())
      .invoiceId(invoice.getId())
      .eventType(eventType)
      .fromStatus(from != null ? from.name() : null)
      .toStatus(to != null ? to.name() : null)
      .actor(actor)
      .detail(detailJson)
      .build();
    eventRepository.save(event);
  }

  private Invoice loadInvoice(UUID tenantId, UUID invoiceId) {
    return repository.findByIdAndTenant(invoiceId, tenantId)
      .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));
  }

  private Invoice lockInvoice(UUID tenantId, UUID invoiceId) {
    return repository.findByIdAndTenantForUpdate(invoiceId, tenantId)
      .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));
  }

  /**
   * Generates a tenant-unique invoice number of the form INV-XXXXXXXX (8 hex chars).
   */
  private String generateInvoiceNumber(UUID tenantId) {
    for (int attempt = 0; attempt < 10; attempt++) {
      String candidate = String.format("INV-%08X", random.nextInt() & 0x7FFFFFFF);
      if (!repository.existsByTenantIdAndInvoiceNumber(tenantId, candidate)) {
        return candidate;
      }
    }
    throw new IllegalStateException("Unable to allocate a unique invoice number");
  }

  private static Direction parseDirection(String value) {
    try {
      return Direction.valueOf(value);
    } catch (IllegalArgumentException | NullPointerException e) {
      throw new IllegalArgumentException("Invalid direction: " + value + " (expected RECEIVABLE or PAYABLE)");
    }
  }

  private static Status parseStatus(String value) {
    try {
      return Status.valueOf(value);
    } catch (IllegalArgumentException | NullPointerException e) {
      throw new IllegalArgumentException("Invalid status: " + value);
    }
  }

  private static BigDecimal scale(BigDecimal value) {
    return value == null ? null : value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
  }

  private static BigDecimal nullToZero(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
  }

  /**
   * Strips CR/LF/tab from user-derived values before logging to prevent log injection.
   */
  private static String sanitizeForLog(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("[\r\n\t]", "_");
  }

  private InvoiceResponse mapToResponse(Invoice invoice, List<InvoiceLineItem> lineItems) {
    List<InvoiceLineItemDto> lines = lineItems == null ? List.of() : lineItems.stream()
      .map(li -> InvoiceLineItemDto.builder()
        .id(li.getId())
        .description(li.getDescription())
        .quantity(li.getQuantity())
        .unitPrice(li.getUnitPrice())
        .lineTotal(li.getLineTotal())
        .build())
      .toList();
    return baseResponse(invoice).lineItems(lines).build();
  }

  private InvoiceResponse mapToResponseWithoutLines(Invoice invoice) {
    return baseResponse(invoice).build();
  }

  private InvoiceResponse.InvoiceResponseBuilder baseResponse(Invoice invoice) {
    BigDecimal amountDue = scale(invoice.getTotal().subtract(invoice.getAmountPaid()));
    return InvoiceResponse.builder()
      .id(invoice.getId())
      .tenantId(invoice.getTenantId())
      .invoiceNumber(invoice.getInvoiceNumber())
      .direction(invoice.getDirection().name())
      .counterpartyName(invoice.getCounterpartyName())
      .counterpartyId(invoice.getCounterpartyId())
      .currency(invoice.getCurrency())
      .subtotal(invoice.getSubtotal())
      .taxAmount(invoice.getTaxAmount())
      .total(invoice.getTotal())
      .amountPaid(invoice.getAmountPaid())
      .amountDue(amountDue)
      .status(invoice.getStatus().name())
      .issueDate(invoice.getIssueDate())
      .dueDate(invoice.getDueDate())
      .orderId(invoice.getOrderId())
      .notes(invoice.getNotes())
      .metadata(invoice.getMetadata())
      .createdAt(invoice.getCreatedAt())
      .updatedAt(invoice.getUpdatedAt());
  }
}
