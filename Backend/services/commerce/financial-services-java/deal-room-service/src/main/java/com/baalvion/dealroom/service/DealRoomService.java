package com.baalvion.dealroom.service;

import com.baalvion.common.security.AuthContext;
import com.baalvion.dealroom.config.DealRoomProperties;
import com.baalvion.dealroom.domain.*;
import com.baalvion.dealroom.domain.CounterOffer.OfferStatus;
import com.baalvion.dealroom.domain.DealRoom.DealStatus;
import com.baalvion.dealroom.domain.DealRoom.OriginType;
import com.baalvion.dealroom.domain.DealRoom.Party;
import com.baalvion.dealroom.domain.TermSheet.TermSheetStatus;
import com.baalvion.dealroom.dto.*;
import com.baalvion.dealroom.exception.NotFoundException;
import com.baalvion.dealroom.realtime.DealRoomBroadcaster;
import com.baalvion.dealroom.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * The negotiation engine. A deal room opens between a buyer and a seller; the two sides exchange
 * counter-offers (each round superseding the last live offer); when a side accepts the other's
 * live offer the deal is AGREED and a term sheet is generated; both sign to reach EXECUTED.
 * Agreement and execution post outbox events for the smart-contract / order / trade-finance services,
 * and every change is pushed live to participants over WebSocket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DealRoomService {

  private static final int MONEY_SCALE = 4;

  private final DealRoomRepository dealRepository;
  private final CounterOfferRepository offerRepository;
  private final TermSheetRepository termSheetRepository;
  private final DealMessageRepository messageRepository;
  private final OutboxService outbox;
  private final DealRoomBroadcaster broadcaster;
  private final DealRoomProperties props;

  // --------------------------------------------------------------------------- open / read

  public DealResponse open(UUID tenantId, OpenDealRequest req) {
    String idem = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
      ? req.getIdempotencyKey() : UUID.randomUUID().toString();

    var existing = dealRepository.findByTenantIdAndIdempotencyKey(tenantId, idem);
    if (existing.isPresent()) {
      log.info("Idempotent deal open: key={} already exists for tenant={}", idem, tenantId);
      return DealResponse.from(existing.get());
    }

    validateCurrency(req.getCurrency());
    Party opener = parseParty(req.getOpeningParty(), "openingParty");
    int ttl = req.getTtlHours() != null ? req.getTtlHours() : props.getDefaultTtlHours();

    DealRoom deal = DealRoom.builder()
      .tenantId(tenantId)
      .idempotencyKey(idem)
      .reference(generateReference(tenantId))
      .originType(req.getOriginType() != null ? parseEnum(OriginType.class, req.getOriginType(), "originType") : OriginType.LISTING)
      .originId(req.getOriginId())
      .title(req.getTitle())
      .commodity(req.getCommodity())
      .buyerId(req.getBuyerId()).buyerName(req.getBuyerName())
      .sellerId(req.getSellerId()).sellerName(req.getSellerName())
      .currency(req.getCurrency().toUpperCase())
      .unit(req.getUnit())
      .incoterm(req.getIncoterm())
      .status(DealStatus.OPEN)
      .expiresAt(LocalDateTime.now().plusHours(ttl))
      .createdBy(AuthContext.currentUserId().orElse(null))
      .metadata(req.getMetadata() != null ? req.getMetadata() : "{}")
      .build();
    deal = dealRepository.save(deal);
    systemMessage(deal, "Deal room opened by " + opener);

    // Optionally seed the first offer.
    if (req.getInitialPrice() != null && req.getInitialQuantity() != null) {
      CounterOffer seed = recordOffer(deal, opener, req.getInitialPrice(), req.getInitialQuantity(),
        req.getUnit(), deal.getCurrency(), req.getIncoterm(), null, null, req.getMessage(), null);
      applyLiveOffer(deal, seed);
    }
    DealRoom saved = dealRepository.save(deal);

    log.info("Deal room opened: id={}, ref={}, tenant={}, buyer={}, seller={}",
      saved.getId(), saved.getReference(), tenantId, saved.getBuyerId(), saved.getSellerId());
    outbox.enqueue(tenantId, "dealroom.deal.opened", saved.getId().toString(), DealResponse.from(saved));
    broadcaster.publish(saved.getId().toString(), "deal.opened", DealResponse.from(saved));
    return DealResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public DealResponse get(UUID tenantId, UUID id) {
    return DealResponse.from(load(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<DealResponse> list(UUID tenantId, String status, UUID buyerId, UUID sellerId, int page, int size) {
    var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<DealRoom> result;
    if (status != null) result = dealRepository.findByTenantIdAndStatus(tenantId, parseEnum(DealStatus.class, status, "status"), pageable);
    else if (buyerId != null) result = dealRepository.findByTenantIdAndBuyerId(tenantId, buyerId, pageable);
    else if (sellerId != null) result = dealRepository.findByTenantIdAndSellerId(tenantId, sellerId, pageable);
    else result = dealRepository.findByTenantId(tenantId, pageable);
    return result.map(DealResponse::from);
  }

  // --------------------------------------------------------------------------- negotiation

  public CounterOfferResponse counter(UUID tenantId, UUID dealId, CounterOfferRequest req) {
    DealRoom deal = load(tenantId, dealId);
    requireNegotiable(deal);
    if (deal.getRoundCount() >= props.getMaxRounds()) {
      throw new IllegalStateException("Maximum negotiation rounds (" + props.getMaxRounds() + ") reached");
    }
    Party party = parseParty(req.getParty(), "party");

    // Supersede the prior live offer.
    for (CounterOffer live : offerRepository.findByDealIdAndStatus(dealId, OfferStatus.PROPOSED)) {
      live.setStatus(OfferStatus.SUPERSEDED);
      live.setDecidedAt(LocalDateTime.now());
      offerRepository.save(live);
    }

    Integer validFor = req.getValidForHours() != null ? req.getValidForHours() : props.getOfferValidityHours();
    CounterOffer offer = recordOffer(deal, party,
      req.getPrice(), req.getQuantity(), req.getUnit(), deal.getCurrency(),
      req.getIncoterm(), req.getDeliveryTerms(), req.getPaymentTerms(), req.getMessage(),
      LocalDateTime.now().plusHours(validFor));
    applyLiveOffer(deal, offer);
    dealRepository.save(deal);

    log.info("Counter-offer: deal={}, round={}, by={}, price={} {}, tenant={}",
      dealId, offer.getRound(), party, offer.getPrice(), deal.getCurrency(), tenantId);
    outbox.enqueue(tenantId, "dealroom.deal.countered", dealId.toString(), CounterOfferResponse.from(offer));
    broadcaster.publish(dealId.toString(), "deal.countered", CounterOfferResponse.from(offer));
    return CounterOfferResponse.from(offer);
  }

  /** Accept the live offer. The accepting party must be the side that did NOT make it. */
  public DealResponse accept(UUID tenantId, UUID dealId, String acceptingParty) {
    DealRoom deal = load(tenantId, dealId);
    requireNegotiable(deal);
    Party accepter = parseParty(acceptingParty, "party");
    CounterOffer live = liveOffer(dealId);
    if (live.getOfferedBy() == accepter) {
      throw new IllegalArgumentException("You cannot accept your own offer; the counterparty must accept it");
    }
    if (live.getValidUntil() != null && LocalDateTime.now().isAfter(live.getValidUntil())) {
      throw new IllegalStateException("The live offer has expired; a new counter-offer is required");
    }

    live.setStatus(OfferStatus.ACCEPTED);
    live.setDecidedAt(LocalDateTime.now());
    offerRepository.save(live);

    TermSheet ts = TermSheet.builder()
      .dealId(dealId).tenantId(tenantId)
      .price(live.getPrice()).quantity(live.getQuantity()).unit(live.getUnit())
      .currency(deal.getCurrency())
      .totalValue(live.getPrice().multiply(live.getQuantity()).setScale(MONEY_SCALE, RoundingMode.HALF_UP))
      .incoterm(live.getIncoterm() != null ? live.getIncoterm() : deal.getIncoterm())
      .paymentTerms(live.getPaymentTerms()).deliveryTerms(live.getDeliveryTerms())
      .status(TermSheetStatus.AWAITING_SIGNATURES)
      .build();
    ts = termSheetRepository.save(ts);

    deal.setStatus(DealStatus.AGREED);
    deal.setAgreedAt(LocalDateTime.now());
    deal.setTermSheetId(ts.getId());
    dealRepository.save(deal);
    systemMessage(deal, accepter + " accepted the offer from " + live.getOfferedBy() + "; term sheet issued");

    log.info("Deal agreed: deal={}, offer={}, termSheet={}, tenant={}", dealId, live.getId(), ts.getId(), tenantId);
    outbox.enqueue(tenantId, "dealroom.deal.agreed", dealId.toString(), DealResponse.from(deal));
    broadcaster.publish(dealId.toString(), "deal.agreed", DealResponse.from(deal));
    return DealResponse.from(deal);
  }

  /** Reject the live offer; the room stays open for a fresh counter-offer. */
  public CounterOfferResponse rejectOffer(UUID tenantId, UUID dealId, String rejectingParty, String reason) {
    DealRoom deal = load(tenantId, dealId);
    requireNegotiable(deal);
    parseParty(rejectingParty, "party");
    CounterOffer live = liveOffer(dealId);
    live.setStatus(OfferStatus.REJECTED);
    live.setDecidedAt(LocalDateTime.now());
    offerRepository.save(live);
    deal.setCurrentOfferBy(null);
    dealRepository.save(deal);
    systemMessage(deal, rejectingParty + " rejected the live offer" + (reason != null ? ": " + reason : ""));
    broadcaster.publish(dealId.toString(), "offer.rejected", CounterOfferResponse.from(live));
    return CounterOfferResponse.from(live);
  }

  /** Terminate the whole negotiation (no agreement). */
  public DealResponse rejectDeal(UUID tenantId, UUID dealId, String reason) {
    DealRoom deal = load(tenantId, dealId);
    if (deal.getStatus() == DealStatus.AGREED || isTerminal(deal)) {
      throw new IllegalStateException("Deal cannot be rejected in status " + deal.getStatus());
    }
    deal.setStatus(DealStatus.REJECTED);
    dealRepository.save(deal);
    systemMessage(deal, "Deal rejected" + (reason != null ? ": " + reason : ""));
    outbox.enqueue(tenantId, "dealroom.deal.rejected", dealId.toString(), DealResponse.from(deal));
    broadcaster.publish(dealId.toString(), "deal.rejected", DealResponse.from(deal));
    return DealResponse.from(deal);
  }

  public DealResponse cancel(UUID tenantId, UUID dealId, String reason) {
    DealRoom deal = load(tenantId, dealId);
    if (isTerminal(deal)) throw new IllegalStateException("Deal is already terminal (" + deal.getStatus() + ")");
    deal.setStatus(DealStatus.CANCELLED);
    dealRepository.save(deal);
    systemMessage(deal, "Deal cancelled" + (reason != null ? ": " + reason : ""));
    broadcaster.publish(dealId.toString(), "deal.cancelled", DealResponse.from(deal));
    return DealResponse.from(deal);
  }

  // --------------------------------------------------------------------------- term sheet

  @Transactional(readOnly = true)
  public TermSheetResponse getTermSheet(UUID tenantId, UUID dealId) {
    load(tenantId, dealId);
    return TermSheetResponse.from(termSheetRepository.findByDealId(dealId)
      .orElseThrow(() -> new NotFoundException("No term sheet for deal: " + dealId)));
  }

  /** Records a party's signature; EXECUTED once both sides have signed. */
  public TermSheetResponse sign(UUID tenantId, UUID dealId, String party) {
    DealRoom deal = load(tenantId, dealId);
    if (deal.getStatus() != DealStatus.AGREED) {
      throw new IllegalStateException("Term sheet can only be signed on an AGREED deal (was " + deal.getStatus() + ")");
    }
    Party p = parseParty(party, "party");
    TermSheet ts = termSheetRepository.findByDealId(dealId)
      .orElseThrow(() -> new NotFoundException("No term sheet for deal: " + dealId));
    if (ts.getStatus() != TermSheetStatus.AWAITING_SIGNATURES) {
      throw new IllegalStateException("Term sheet is not awaiting signatures (" + ts.getStatus() + ")");
    }
    String userId = AuthContext.currentUserId().orElse(null);
    if (p == Party.BUYER) {
      if (ts.getBuyerSignedAt() != null) throw new IllegalStateException("Buyer has already signed");
      ts.setBuyerSignedAt(LocalDateTime.now());
      ts.setBuyerSignedBy(userId);
    } else {
      if (ts.getSellerSignedAt() != null) throw new IllegalStateException("Seller has already signed");
      ts.setSellerSignedAt(LocalDateTime.now());
      ts.setSellerSignedBy(userId);
    }
    boolean both = ts.getBuyerSignedAt() != null && ts.getSellerSignedAt() != null;
    if (both) {
      ts.setStatus(TermSheetStatus.EXECUTED);
      ts.setExecutedAt(LocalDateTime.now());
    }
    termSheetRepository.save(ts);
    systemMessage(deal, p + " signed the term sheet" + (both ? " — term sheet EXECUTED" : ""));

    log.info("Term sheet signed by {}: deal={}, executed={}, tenant={}", p, dealId, both, tenantId);
    if (both) {
      outbox.enqueue(tenantId, "dealroom.termsheet.executed", dealId.toString(), TermSheetResponse.from(ts));
    }
    broadcaster.publish(dealId.toString(), both ? "termsheet.executed" : "termsheet.signed", TermSheetResponse.from(ts));
    return TermSheetResponse.from(ts);
  }

  // --------------------------------------------------------------------------- messages

  public MessageResponse postMessage(UUID tenantId, UUID dealId, MessageRequest req) {
    DealRoom deal = load(tenantId, dealId);
    DealMessage msg = DealMessage.builder()
      .dealId(dealId).tenantId(tenantId)
      .senderId(AuthContext.currentUserId().orElse(null))
      .senderRole(req.getSenderRole())
      .body(req.getBody())
      .kind(DealMessage.MessageKind.CHAT)
      .build();
    msg = messageRepository.save(msg);
    broadcaster.publish(dealId.toString(), "message", MessageResponse.from(msg));
    return MessageResponse.from(msg);
  }

  @Transactional(readOnly = true)
  public List<MessageResponse> listMessages(UUID tenantId, UUID dealId) {
    load(tenantId, dealId);
    return messageRepository.findByDealIdOrderByCreatedAtAsc(dealId).stream().map(MessageResponse::from).toList();
  }

  @Transactional(readOnly = true)
  public List<CounterOfferResponse> listOffers(UUID tenantId, UUID dealId) {
    load(tenantId, dealId);
    return offerRepository.findByDealIdOrderByRoundAsc(dealId).stream().map(CounterOfferResponse::from).toList();
  }

  // --------------------------------------------------------------------------- scheduled expiry

  @Transactional
  public int expireOverdue() {
    List<DealRoom> overdue = dealRepository.findByStatusInAndExpiresAtBefore(
      List.of(DealStatus.OPEN, DealStatus.NEGOTIATING), LocalDateTime.now());
    for (DealRoom deal : overdue) {
      deal.setStatus(DealStatus.EXPIRED);
      broadcaster.publish(deal.getId().toString(), "deal.expired", DealResponse.from(deal));
    }
    if (!overdue.isEmpty()) {
      dealRepository.saveAll(overdue);
      log.info("Expired {} overdue deal rooms", overdue.size());
    }
    return overdue.size();
  }

  // --------------------------------------------------------------------------- helpers

  private DealRoom load(UUID tenantId, UUID id) {
    return dealRepository.findByIdAndTenantId(id, tenantId)
      .orElseThrow(() -> new NotFoundException("Deal room not found: " + id));
  }

  private CounterOffer liveOffer(UUID dealId) {
    List<CounterOffer> live = offerRepository.findByDealIdAndStatus(dealId, OfferStatus.PROPOSED);
    if (live.isEmpty()) throw new IllegalStateException("There is no live offer on the table");
    // The latest round is authoritative if more than one is somehow PROPOSED.
    return live.stream().max((a, b) -> Integer.compare(a.getRound(), b.getRound())).get();
  }

  private CounterOffer recordOffer(DealRoom deal, Party party, BigDecimal price, BigDecimal qty, String unit,
                                   String currency, String incoterm, String deliveryTerms, String paymentTerms,
                                   String message, LocalDateTime validUntil) {
    int next = (int) offerRepository.countByDealId(deal.getId()) + 1;
    CounterOffer offer = CounterOffer.builder()
      .dealId(deal.getId()).tenantId(deal.getTenantId()).round(next).offeredBy(party)
      .price(price.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
      .quantity(qty.setScale(MONEY_SCALE, RoundingMode.HALF_UP))
      .unit(unit != null ? unit : deal.getUnit())
      .currency(currency).incoterm(incoterm)
      .deliveryTerms(deliveryTerms).paymentTerms(paymentTerms).message(message)
      .status(OfferStatus.PROPOSED).validUntil(validUntil)
      .createdBy(AuthContext.currentUserId().orElse(null))
      .build();
    return offerRepository.save(offer);
  }

  /** Mirror the live offer onto the room's headline terms and bump the round/status. */
  private void applyLiveOffer(DealRoom deal, CounterOffer offer) {
    deal.setCurrentPrice(offer.getPrice());
    deal.setCurrentQuantity(offer.getQuantity());
    if (offer.getUnit() != null) deal.setUnit(offer.getUnit());
    if (offer.getIncoterm() != null) deal.setIncoterm(offer.getIncoterm());
    deal.setCurrentOfferBy(offer.getOfferedBy());
    deal.setRoundCount(offer.getRound());
    deal.setStatus(DealStatus.NEGOTIATING);
  }

  private void systemMessage(DealRoom deal, String body) {
    messageRepository.save(DealMessage.builder()
      .dealId(deal.getId()).tenantId(deal.getTenantId()).senderRole("SYSTEM")
      .body(body).kind(DealMessage.MessageKind.SYSTEM).build());
  }

  private void requireNegotiable(DealRoom deal) {
    if (isTerminal(deal) || deal.getStatus() == DealStatus.AGREED) {
      throw new IllegalStateException("Deal is not open for negotiation (status " + deal.getStatus() + ")");
    }
    if (LocalDateTime.now().isAfter(deal.getExpiresAt())) {
      throw new IllegalStateException("Deal room has expired");
    }
  }

  private boolean isTerminal(DealRoom deal) {
    return deal.getStatus() == DealStatus.REJECTED || deal.getStatus() == DealStatus.EXPIRED
      || deal.getStatus() == DealStatus.CANCELLED;
  }

  private String generateReference(UUID tenantId) {
    for (int i = 0; i < 6; i++) {
      String candidate = "DR-" + java.time.Year.now().getValue() + "-"
        + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
      if (!dealRepository.existsByTenantIdAndReference(tenantId, candidate)) return candidate;
    }
    throw new IllegalStateException("Unable to allocate a unique deal reference");
  }

  private Party parseParty(String value, String field) {
    return parseEnum(Party.class, value, field);
  }

  private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
    try {
      return Enum.valueOf(type, value.trim().toUpperCase());
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid " + field + ": " + value);
    }
  }

  private void validateCurrency(String currency) {
    if (currency == null || currency.trim().length() != 3) {
      throw new IllegalArgumentException("currency must be a 3-letter ISO 4217 code");
    }
  }
}
