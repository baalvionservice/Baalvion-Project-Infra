package com.baalvion.smartcontract.service;

import com.baalvion.smartcontract.domain.TradeContract.Incoterm;
import com.baalvion.smartcontract.domain.TradeContract.PaymentMethod;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Assembles the standard clause set for a sale contract from its Incoterms 2020 rule and payment
 * method, plus boilerplate (governing law, dispute resolution, inspection, force majeure). Returns
 * an ordered JSON array of {heading, text} stored on the contract; a real deployment renders these
 * into the signable PDF.
 */
@Component
@RequiredArgsConstructor
public class ClauseBuilder {

  private final ObjectMapper objectMapper;

  /** ICC Incoterms 2020: the delivery point + risk/cost transfer summary per rule. */
  private static final Map<Incoterm, String> INCOTERM_TEXT = Map.ofEntries(
    Map.entry(Incoterm.EXW, "Ex Works: the seller makes the goods available at its premises; the buyer bears all costs and risks from collection."),
    Map.entry(Incoterm.FCA, "Free Carrier: the seller delivers the goods, cleared for export, to the carrier nominated by the buyer at the named place; risk passes on delivery."),
    Map.entry(Incoterm.CPT, "Carriage Paid To: the seller pays carriage to the named destination; risk passes when the goods are handed to the first carrier."),
    Map.entry(Incoterm.CIP, "Carriage and Insurance Paid To: as CPT, and the seller procures all-risks (Institute Cargo Clauses A) insurance to destination."),
    Map.entry(Incoterm.DAP, "Delivered at Place: the seller delivers when the goods are placed at the buyer's disposal at the named place, ready for unloading."),
    Map.entry(Incoterm.DPU, "Delivered at Place Unloaded: the seller delivers and unloads the goods at the named place; the only rule requiring the seller to unload."),
    Map.entry(Incoterm.DDP, "Delivered Duty Paid: the seller delivers cleared for import, with all duties and taxes paid; maximum seller obligation."),
    Map.entry(Incoterm.FAS, "Free Alongside Ship: the seller delivers when the goods are placed alongside the vessel at the named port of shipment."),
    Map.entry(Incoterm.FOB, "Free On Board: the seller delivers on board the vessel nominated by the buyer at the named port of shipment; risk passes on board."),
    Map.entry(Incoterm.CFR, "Cost and Freight: the seller pays cost and freight to the named destination port; risk passes when on board at shipment."),
    Map.entry(Incoterm.CIF, "Cost, Insurance and Freight: as CFR, and the seller procures marine insurance (minimum Institute Cargo Clauses C) to destination.")
  );

  private static final Map<PaymentMethod, String> PAYMENT_TEXT = Map.of(
    PaymentMethod.LC, "Payment by irrevocable documentary Letter of Credit subject to UCP 600, available with the issuing/nominated bank against complying presentation.",
    PaymentMethod.BG, "Payment supported by an independent bank guarantee subject to URDG 758, payable on first written demand.",
    PaymentMethod.TT, "Payment by telegraphic transfer (wire) to the seller's nominated account per the agreed schedule.",
    PaymentMethod.OA, "Open account terms: the buyer pays within the agreed credit period after shipment/invoice.",
    PaymentMethod.BNPL, "Buy-Now-Pay-Later: financed installment terms per the platform credit facility; the seller is paid on shipment.",
    PaymentMethod.ESCROW, "Payment held in platform escrow and released against the agreed milestones/inspection."
  );

  public String build(Incoterm incoterm, PaymentMethod paymentMethod, String namedPlace,
                      String governingLaw, String disputeResolution) {
    List<Map<String, String>> clauses = new ArrayList<>();
    clauses.add(clause("Delivery (Incoterms 2020 " + incoterm.name() + (namedPlace != null ? " " + namedPlace : "") + ")",
      INCOTERM_TEXT.getOrDefault(incoterm, "Delivery per the agreed Incoterms 2020 rule.")));
    clauses.add(clause("Payment", PAYMENT_TEXT.getOrDefault(paymentMethod, "Payment per the agreed terms.")));
    clauses.add(clause("Title & Risk", "Title passes on full payment; risk passes per the applicable Incoterms 2020 rule above."));
    clauses.add(clause("Inspection", "The buyer may appoint an independent inspection agency (e.g. SGS, Bureau Veritas, Intertek) at the agreed point; the certificate is binding as to quality and quantity."));
    clauses.add(clause("Force Majeure", "Neither party is liable for failure to perform due to events beyond its reasonable control; ICC Force Majeure Clause 2020 applies."));
    clauses.add(clause("Governing Law", "This contract is governed by " + (governingLaw != null ? governingLaw : "English Law") + "."));
    clauses.add(clause("Dispute Resolution", disputeResolution != null ? disputeResolution
      : "ICC Arbitration, single arbitrator, seat London; the award is final and binding."));
    try {
      return objectMapper.writeValueAsString(clauses);
    } catch (Exception e) {
      throw new IllegalStateException("Unable to serialize contract clauses", e);
    }
  }

  private Map<String, String> clause(String heading, String text) {
    Map<String, String> m = new LinkedHashMap<>();
    m.put("heading", heading);
    m.put("text", text);
    return m;
  }
}
